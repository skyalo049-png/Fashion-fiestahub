-- ============================================================================
-- 14 — the staff write path
-- ============================================================================
-- The dashboard's first version needs to do four things the database could
-- not previously do, and it needs to do them without opening a hole.
--
-- Three of the four are functions that did not exist:
--
--   1. Quote a delivery fee. create_order parks an order at
--      awaiting_delivery_quote with delivery_fee_kes NULL, and nothing since
--      has been able to set it. That decision — staff quote each order by
--      hand — was taken, but only ever implemented as a raw SQL UPDATE.
--
--   2. Advance an order through the rest of its life (processing, shipped,
--      delivered, cancelled).
--
--   3. Change physical stock. The `restock` and `adjustment` values have been
--      in movement_reason since migration 02 and are referenced by zero
--      functions; the only thing that ever moved stock_qty was verify_payment
--      recording a sale.
--
-- Every one of them is security definer and gated on is_staff(). That gate is
-- not decoration: these functions bypass RLS by virtue of being definer, so
-- the is_staff() check inside each one IS the boundary. Forgetting it in a new
-- function is the single easiest way to hand a customer the whole admin.
--
-- The fourth thing is a read: admin_list_orders and admin_order_detail exist
-- so the dashboard does not have to make six round trips per screen and then
-- stitch them together in TypeScript. They return jsonb for the same reason
-- lookup_order does — one shape, defined once, in the place that owns the data.

-- ---------------------------------------------------------------------------
-- whoami()
-- ---------------------------------------------------------------------------
-- Lets /admin render "you are signed in but not staff" instead of a page of
-- empty tables. An empty list and a forbidden list look identical otherwise,
-- and that ambiguity has already cost time once in this project.
--
-- Returns is_staff = false rather than raising for a signed-out caller: the
-- layout calls it on every render, including the one that redirects to login.
create or replace function whoami()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid;
  v_email text;
  v_role  text;
begin
  v_uid := auth.uid();

  if v_uid is null then
    return jsonb_build_object('user_id', null, 'email', null,
                              'is_staff', false, 'role', null);
  end if;

  select email into v_email from auth.users where id = v_uid;
  select role  into v_role  from staff where user_id = v_uid;

  return jsonb_build_object(
    'user_id',  v_uid,
    'email',    v_email,
    'is_staff', v_role is not null,
    'role',     v_role
  );
end;
$$;

comment on function whoami() is
  'Identity and staff status for the signed-in caller. Powers the /admin gate message.';

-- ---------------------------------------------------------------------------
-- quote_delivery()
-- ---------------------------------------------------------------------------
-- The step that has been missing since checkout was built: a human decides
-- what delivery costs, and the order becomes payable.
--
-- The total is computed HERE, from the stored subtotal plus the staff-entered
-- fee. A client never supplies the total, for the same reason create_order
-- ignores client-supplied prices: money is computed server-side or it is not
-- trustworthy.
--
-- The reservation window is extended on quote. Quoting can happen hours after
-- the order lands, and the original 48 hours should not be spent while the
-- customer waits to hear a fee. Without this, a quote sent at hour 47 gives
-- the customer one hour to pay before the hold lapses.
create or replace function quote_delivery(
  p_order_number text,
  p_fee_kes      integer,
  p_note         text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order  record;
  v_total  integer;
begin
  if not is_staff() then
    raise exception 'not_staff' using errcode = '42501';
  end if;

  if p_fee_kes is null or p_fee_kes < 0 then
    raise exception 'invalid_fee' using errcode = '22023';
  end if;

  select id, order_number, status, subtotal_kes
    into v_order
  from orders
  where order_number = btrim(p_order_number)
  for update;

  if not found then
    raise exception 'not_found' using errcode = '22023';
  end if;

  -- Re-quoting an order already awaiting payment is legitimate: a customer
  -- moved to a different town, or the first fee was wrong. Re-quoting an order
  -- the customer has already paid for is not, and would rewrite history.
  if v_order.status not in ('awaiting_delivery_quote', 'awaiting_payment') then
    raise exception 'wrong_status:%', v_order.status using errcode = '22023';
  end if;

  v_total := v_order.subtotal_kes + p_fee_kes;

  update orders
     set delivery_fee_kes       = p_fee_kes,
         total_kes              = v_total,
         status                 = 'awaiting_payment',
         reservation_expires_at = greatest(reservation_expires_at,
                                           now() + interval '48 hours'),
         updated_at             = now()
   where id = v_order.id;

  insert into order_events (order_id, type, actor, payload, visible_to_customer)
  values (
    v_order.id, 'delivery_quoted', 'staff',
    jsonb_build_object(
      'delivery_fee_kes', p_fee_kes,
      'total_kes',        v_total,
      'note',             nullif(btrim(coalesce(p_note, '')), '')
    ),
    true
  );

  -- The staff-only counterpart, so the dashboard can show what was said
  -- internally without that reaching the customer's status page.
  if nullif(btrim(coalesce(p_note, '')), '') is not null then
    insert into order_events (order_id, type, actor, payload, visible_to_customer)
    values (
      v_order.id, 'staff_note', 'staff',
      jsonb_build_object('note', btrim(p_note)),
      false
    );
  end if;

  return jsonb_build_object(
    'order_number',     v_order.order_number,
    'status',           'awaiting_payment',
    'subtotal_kes',     v_order.subtotal_kes,
    'delivery_fee_kes', p_fee_kes,
    'total_kes',        v_total
  );
end;
$$;

comment on function quote_delivery(text, integer, text) is
  'Staff sets the delivery fee; total is computed here from the stored subtotal. Moves the order to awaiting_payment and extends the hold.';

-- ---------------------------------------------------------------------------
-- set_order_status()
-- ---------------------------------------------------------------------------
-- The statuses after payment. `paid` is deliberately NOT reachable from here:
-- only verify_payment() may mark an order paid, and that is the function that
-- moves stock. A generic status setter that could write `paid` would let an
-- order be marked settled without the deduction ever happening.
--
-- Cancelling releases the hold for free. Reservations are derived from
-- order_items joined to orders, and the view counts only the three open
-- statuses — so a cancelled order stops holding stock the moment this commits,
-- with no compensating write. That is the payoff of the derived-reservation
-- model, and it is worth not "fixing" into an explicit release.
create or replace function set_order_status(
  p_order_number text,
  p_status       text,
  p_note         text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order   record;
  v_new     order_status;
  v_allowed order_status[] := array[
    'processing', 'shipped', 'delivered', 'cancelled'
  ]::order_status[];
begin
  if not is_staff() then
    raise exception 'not_staff' using errcode = '42501';
  end if;

  begin
    v_new := p_status::order_status;
  exception when invalid_text_representation then
    raise exception 'invalid_status:%', p_status using errcode = '22023';
  end;

  if not (v_new = any (v_allowed)) then
    raise exception 'status_not_settable:%', p_status using errcode = '22023';
  end if;

  select id, order_number, status into v_order
  from orders
  where order_number = btrim(p_order_number)
  for update;

  if not found then
    raise exception 'not_found' using errcode = '22023';
  end if;

  if v_order.status = v_new then
    raise exception 'wrong_status:%', v_order.status using errcode = '22023';
  end if;

  update orders
     set status     = v_new,
         updated_at = now()
   where id = v_order.id;

  insert into order_events (order_id, type, actor, payload, visible_to_customer)
  values (
    v_order.id, 'status_changed', 'staff',
    jsonb_build_object(
      'from', v_order.status,
      'to',   v_new,
      'note', nullif(btrim(coalesce(p_note, '')), '')
    ),
    true
  );

  return jsonb_build_object('order_number', v_order.order_number,
                            'status', v_new);
end;
$$;

comment on function set_order_status(text, text, text) is
  'Staff advances an order after payment. Cannot set paid — only verify_payment may do that.';

-- ---------------------------------------------------------------------------
-- set_variant_stock()
-- ---------------------------------------------------------------------------
-- The only supported way to change physical stock.
--
-- Both writes happen together or neither does: stock_qty moves, and the
-- matching inventory_movements row records why. This is what keeps
-- sum(delta) = stock_qty true, which is currently true (88 = 88) and would
-- stop being true the first time someone ran a bare UPDATE from the dashboard.
--
-- p_stock_qty is the NEW absolute count, not a delta — that is how a human
-- counting a shelf thinks, and it is what the grid form submits. The delta is
-- computed here and recorded, so the ledger stays append-only.
--
-- No-ops return early without writing a zero-delta row: a ledger padded with
-- "nothing changed" entries is harder to read, not more auditable.
create or replace function set_variant_stock(
  p_variant_id uuid,
  p_stock_qty  integer,
  p_reason     text default 'restock',
  p_note       text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_variant record;
  v_delta   integer;
  v_reason  movement_reason;
begin
  if not is_staff() then
    raise exception 'not_staff' using errcode = '42501';
  end if;

  if p_stock_qty is null or p_stock_qty < 0 then
    raise exception 'invalid_quantity' using errcode = '22023';
  end if;

  begin
    v_reason := p_reason::movement_reason;
  exception when invalid_text_representation then
    raise exception 'invalid_reason:%', p_reason using errcode = '22023';
  end;

  -- sale is written by verify_payment and nowhere else; reserve and release
  -- are not written at all under the derived-reservation model. Accepting them
  -- here would let the dashboard forge the audit trail of a payment.
  if v_reason not in ('restock', 'adjustment') then
    raise exception 'reason_not_settable:%', p_reason using errcode = '22023';
  end if;

  select id, sku, stock_qty into v_variant
  from product_variants
  where id = p_variant_id
  for update;

  if not found then
    raise exception 'not_found' using errcode = '22023';
  end if;

  v_delta := p_stock_qty - v_variant.stock_qty;

  if v_delta = 0 then
    return jsonb_build_object('variant_id', p_variant_id,
                              'stock_qty',  p_stock_qty,
                              'delta',      0,
                              'changed',    false);
  end if;

  update product_variants
     set stock_qty  = p_stock_qty,
         updated_at = now()
   where id = p_variant_id;

  insert into inventory_movements (variant_id, delta, reason, order_id, note)
  values (
    p_variant_id, v_delta, v_reason, null,
    nullif(btrim(coalesce(p_note, '')), '')
  );

  return jsonb_build_object('variant_id', p_variant_id,
                            'stock_qty',  p_stock_qty,
                            'delta',      v_delta,
                            'changed',    true);
end;
$$;

comment on function set_variant_stock(uuid, integer, text, text) is
  'Sets absolute stock and records the delta in inventory_movements, in one transaction. The only supported way to change physical stock.';

-- ---------------------------------------------------------------------------
-- admin_list_orders()
-- ---------------------------------------------------------------------------
-- One round trip for the orders queue.
--
-- Ordered so the work that needs a human is at the top: an order waiting on a
-- quote or on payment verification is blocking a customer, and an order that
-- is merely shipped is not.
create or replace function admin_list_orders(
  p_status text default null,
  p_limit  integer default 50,
  p_offset integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status order_status;
  v_rows   jsonb;
begin
  if not is_staff() then
    raise exception 'not_staff' using errcode = '42501';
  end if;

  if nullif(btrim(coalesce(p_status, '')), '') is not null then
    begin
      v_status := p_status::order_status;
    exception when invalid_text_representation then
      raise exception 'invalid_status:%', p_status using errcode = '22023';
    end;
  end if;

  select coalesce(jsonb_agg(row order by
           -- Blocking states first, then oldest first within each.
           case o.status
             when 'awaiting_delivery_quote'       then 0
             when 'awaiting_payment_verification' then 1
             when 'awaiting_payment'              then 2
             when 'paid'                          then 3
             else 4
           end,
           o.created_at), '[]'::jsonb)
    into v_rows
  from (
    select
      o.order_number,
      o.status,
      o.subtotal_kes,
      o.delivery_fee_kes,
      o.total_kes,
      o.mpesa_code,
      o.created_at,
      o.reservation_expires_at,
      c.full_name,
      c.phone,
      a.city,
      (select count(*) from order_items oi where oi.order_id = o.id)
        as item_count
    from orders o
    join customers c on c.id = o.customer_id
    left join addresses a on a.id = o.address_id
    where v_status is null or o.status = v_status
    order by o.created_at desc
    limit least(coalesce(p_limit, 50), 200)
    offset greatest(coalesce(p_offset, 0), 0)
  ) o;

  return jsonb_build_object(
    'orders', v_rows,
    'counts', (
      select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
      from (
        select status::text as status, count(*) as n
        from orders group by status
      ) c
    )
  );
end;
$$;

comment on function admin_list_orders(text, integer, integer) is
  'Staff order queue with per-status counts. Blocking statuses sort first.';

-- ---------------------------------------------------------------------------
-- admin_order_detail()
-- ---------------------------------------------------------------------------
-- Everything the order screen needs, including the events the customer's
-- lookup deliberately hides. lookup_order filters on visible_to_customer;
-- this does not, and that difference is the reason these are two functions
-- rather than one with a flag — a flag is one boolean away from leaking
-- internal notes onto a public page.
create or replace function admin_order_detail(p_order_number text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
begin
  if not is_staff() then
    raise exception 'not_staff' using errcode = '42501';
  end if;

  select
    o.id, o.order_number, o.status, o.subtotal_kes, o.delivery_fee_kes,
    o.total_kes, o.notes, o.mpesa_code, o.payment_phone,
    o.payment_submitted_at, o.payment_verified_at,
    o.reservation_expires_at, o.created_at,
    c.full_name, c.phone, c.email,
    a.city
  into v_order
  from orders o
  join customers c on c.id = o.customer_id
  left join addresses a on a.id = o.address_id
  where o.order_number = btrim(p_order_number);

  if not found then
    raise exception 'not_found' using errcode = '22023';
  end if;

  return jsonb_build_object(
    'order_number',           v_order.order_number,
    'status',                 v_order.status,
    'subtotal_kes',           v_order.subtotal_kes,
    'delivery_fee_kes',       v_order.delivery_fee_kes,
    'total_kes',              v_order.total_kes,
    'notes',                  v_order.notes,
    'mpesa_code',             v_order.mpesa_code,
    'payment_phone',          v_order.payment_phone,
    'payment_submitted_at',   v_order.payment_submitted_at,
    'payment_verified_at',    v_order.payment_verified_at,
    'reservation_expires_at', v_order.reservation_expires_at,
    'created_at',             v_order.created_at,
    'customer', jsonb_build_object(
      'full_name', v_order.full_name,
      'phone',     v_order.phone,
      'email',     v_order.email,
      'city',      v_order.city
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'title',          oi.title_snapshot,
        'sku',            oi.sku_snapshot,
        'size',           oi.size_snapshot,
        'color',          oi.color_snapshot,
        'unit_price_kes', oi.unit_price_kes,
        'qty',            oi.qty,
        'line_total_kes', oi.line_total_kes
      ) order by oi.created_at)
      from order_items oi
      where oi.order_id = v_order.id
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'type',                e.type,
        'actor',               e.actor,
        'payload',             e.payload,
        'visible_to_customer', e.visible_to_customer,
        'created_at',          e.created_at
      ) order by e.created_at desc)
      from order_events e
      where e.order_id = v_order.id
    ), '[]'::jsonb)
  );
end;
$$;

comment on function admin_order_detail(text) is
  'Full staff view of one order, including internal events. lookup_order() hides those deliberately; this does not.';

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
-- authenticated, NOT anon. Every function raises not_staff for an anonymous
-- caller anyway, but granting to anon would put six more callable endpoints in
-- front of the rate limiter's absence — and create_order is already unlimited.
-- Keep the staff surface reachable only by a signed-in session.
grant execute on function whoami()                            to authenticated;
grant execute on function quote_delivery(text, integer, text)  to authenticated;
grant execute on function set_order_status(text, text, text)   to authenticated;
grant execute on function set_variant_stock(uuid, integer, text, text)
  to authenticated;
grant execute on function admin_list_orders(text, integer, integer)
  to authenticated;
grant execute on function admin_order_detail(text)             to authenticated;