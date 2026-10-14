-- ============================================================================
-- 08 — functions
-- ============================================================================
-- The three write/read paths the app actually uses. All are security definer,
-- so RLS on the underlying tables (07) does not block them; each therefore has
-- to enforce its own authorisation, which is stated per function.

-- ---------------------------------------------------------------------------
-- create_order()
-- ---------------------------------------------------------------------------
-- The only way an order is created. The client sends variant ids and
-- quantities. It does NOT send prices, totals or delivery fees — those are
-- read and computed here, server-side, from product_variants. A client that
-- posts its own unit_price_kes is ignored, not trusted.
--
-- Delivery fee is deliberately absent: it is NULL at creation and written
-- later by staff. `total_kes` is NULL for the same reason, so there is no
-- moment where a total exists that does not match the fee.
create or replace function create_order(
  p_phone      text,
  p_full_name  text,
  p_email      text,
  p_address    jsonb,
  p_items      jsonb,
  p_notes      text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone        text;
  v_customer_id  uuid;
  v_address_id   uuid;
  v_order_id     bigint;
  v_order_number text;
  v_subtotal     integer := 0;
  v_item         jsonb;
  v_variant      record;
  v_qty          integer;
  v_available    integer;
  v_expires      timestamptz := now() + interval '48 hours';
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'cart_empty' using errcode = '22023';
  end if;

  v_phone := normalize_phone(p_phone);
  if v_phone is null then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;

  -- Customer identity is the normalised phone. A returning customer keeps
  -- their row (and therefore their order history).
  insert into customers (phone, full_name, email)
  values (v_phone, nullif(btrim(p_full_name), ''), nullif(btrim(p_email), ''))
  on conflict (phone) do update
    set full_name = coalesce(excluded.full_name, customers.full_name),
        email     = coalesce(excluded.email, customers.email)
  returning id into v_customer_id;

  insert into addresses (customer_id, label, line1, line2, city, area, county, phone, is_default)
  values (
    v_customer_id,
    'checkout',
    coalesce(p_address->>'line1', ''),
    nullif(p_address->>'line2', ''),
    nullif(p_address->>'city', ''),
    nullif(p_address->>'area', ''),
    nullif(p_address->>'county', ''),
    v_phone,
    true
  )
  returning id into v_address_id;

  -- order_number is minted by the BEFORE INSERT trigger (04).
  insert into orders (
    order_number, customer_id, address_id, status,
    subtotal_kes, delivery_fee_kes, total_kes, notes, reservation_expires_at
  )
  values (
    null, v_customer_id, v_address_id, 'awaiting_delivery_quote',
    0, null, null, nullif(btrim(p_notes), ''), v_expires
  )
  returning id, order_number into v_order_id, v_order_number;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'qty')::integer, 0);
    if v_qty <= 0 then
      raise exception 'invalid_quantity' using errcode = '22023';
    end if;

    -- FOR UPDATE serialises concurrent checkouts of the same variant, so two
    -- buyers cannot both pass the stock check and oversell it.
    select v.id, v.sku, v.size, v.color, v.price_kes, v.stock_qty, p.title
      into v_variant
    from product_variants v
    join products p on p.id = v.product_id
    where v.id = (v_item->>'variant_id')::uuid
      and v.is_active
      and p.status = 'active'
    for update of v;

    if not found then
      raise exception 'variant_unavailable' using errcode = '22023';
    end if;

    select available_qty into v_available
    from variant_availability
    where variant_id = v_variant.id;

    if coalesce(v_available, 0) < v_qty then
      raise exception 'insufficient_stock:%', v_variant.sku using errcode = '22023';
    end if;

    -- Snapshots. This is what stops an admin editing a title or price from
    -- rewriting what someone bought last week.
    insert into order_items (
      order_id, variant_id,
      title_snapshot, sku_snapshot, size_snapshot, color_snapshot,
      unit_price_kes, qty, line_total_kes
    )
    values (
      v_order_id, v_variant.id,
      v_variant.title, v_variant.sku, v_variant.size, v_variant.color,
      v_variant.price_kes, v_qty, v_variant.price_kes * v_qty
    );

    v_subtotal := v_subtotal + (v_variant.price_kes * v_qty);
  end loop;

  update orders set subtotal_kes = v_subtotal where id = v_order_id;

  insert into order_events (order_id, type, actor, payload, visible_to_customer)
  values (
    v_order_id, 'order_placed', 'customer',
    jsonb_build_object('subtotal_kes', v_subtotal, 'reservation_expires_at', v_expires),
    true
  );

  return jsonb_build_object(
    'order_number',  v_order_number,
    'subtotal_kes',  v_subtotal,
    'status',        'awaiting_delivery_quote',
    'delivery_fee_kes', null,
    'total_kes',     null
  );
end;
$$;

comment on function create_order(text, text, text, jsonb, jsonb, text) is
  'Creates an order with server-computed prices. Client-supplied money is ignored. Delivery fee and total stay NULL until staff confirm.';

-- ---------------------------------------------------------------------------
-- lookup_order()
-- ---------------------------------------------------------------------------
-- Customer-facing order status. The credential is phone + order number, both
-- of which must match. Kenyan mobile numbers are enumerable, so this function
-- is a brute-force oracle unless it is rate limited — hence lookup_attempts.
--
-- Every attempt is recorded, successful or not. On failure the caller gets an
-- empty result, never a hint about which half was wrong.
create or replace function lookup_order(
  p_phone        text,
  p_order_number text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone      text;
  v_ip         inet;
  v_recent     integer;
  v_order      record;
begin
  v_phone := normalize_phone(p_phone);

  -- PostgREST forwards the client address in the request headers.
  begin
    v_ip := nullif(
      split_part(
        coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''),
        ',', 1
      ),
      ''
    )::inet;
  exception when others then
    v_ip := null;
  end;

  -- 10 failures per IP per 15 minutes. Cheap, and enough to make enumeration
  -- pointless without a Redis dependency at this scale.
  if v_ip is not null then
    select count(*) into v_recent
    from lookup_attempts
    where ip = v_ip
      and succeeded = false
      and attempted_at > now() - interval '15 minutes';

    if v_recent >= 10 then
      raise exception 'rate_limited' using errcode = 'P0001';
    end if;
  end if;

  if v_phone is null or p_order_number is null or btrim(p_order_number) = '' then
    insert into lookup_attempts (ip, order_number, succeeded)
    values (v_ip, p_order_number, false);
    return null;
  end if;

  select o.id, o.order_number, o.status, o.subtotal_kes, o.delivery_fee_kes,
         o.total_kes, o.created_at, o.reservation_expires_at
    into v_order
  from orders o
  join customers c on c.id = o.customer_id
  where c.phone = v_phone
    and o.order_number = btrim(p_order_number);

  if not found then
    insert into lookup_attempts (ip, order_number, succeeded)
    values (v_ip, p_order_number, false);
    return null;
  end if;

  insert into lookup_attempts (ip, order_number, succeeded)
  values (v_ip, p_order_number, true);

  return jsonb_build_object(
    'order_number',     v_order.order_number,
    'status',           v_order.status,
    'subtotal_kes',     v_order.subtotal_kes,
    'delivery_fee_kes', v_order.delivery_fee_kes,
    'total_kes',        v_order.total_kes,
    'created_at',       v_order.created_at,
    'reservation_expires_at', v_order.reservation_expires_at,
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
    -- Internal staff notes are excluded by visible_to_customer.
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'type',       e.type,
        'created_at', e.created_at
      ) order by e.created_at)
      from order_events e
      where e.order_id = v_order.id
        and e.visible_to_customer
    ), '[]'::jsonb)
  );
end;
$$;

comment on function lookup_order(text, text) is
  'Order status for the owning customer. Requires phone AND order number; rate limited per IP; returns NULL on any failure.';

-- ---------------------------------------------------------------------------
-- expire_stale_reservations()
-- ---------------------------------------------------------------------------
-- Releases stock held by orders nobody confirmed within the window. Stock is
-- not decremented at reservation time (see 05), so expiring is purely a status
-- change — but it is what returns the units to `available_qty`.
--
-- Safe to run repeatedly; intended to be called by pg_cron or a scheduled job.
create or replace function expire_stale_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_order record;
begin
  for v_order in
    select id
    from orders
    where status in ('awaiting_delivery_quote', 'awaiting_payment')
      and reservation_expires_at <= now()
    for update skip locked
  loop
    update orders set status = 'cancelled' where id = v_order.id;

    insert into order_events (order_id, type, actor, payload, visible_to_customer)
    values (
      v_order.id, 'reservation_expired', 'system',
      jsonb_build_object('reason', 'reservation window lapsed'),
      true
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

comment on function expire_stale_reservations() is
  'Cancels orders whose reservation lapsed. Returns the number released. Idempotent.';

-- ---------------------------------------------------------------------------
-- execute grants
-- ---------------------------------------------------------------------------
-- create_order and lookup_order are the only functions the storefront calls,
-- and both are designed to be safe from an unauthenticated session: they
-- validate their inputs and compute money themselves.
grant execute on function create_order(text, text, text, jsonb, jsonb, text) to anon, authenticated;
grant execute on function lookup_order(text, text) to anon, authenticated;

-- expiry is a maintenance job, not a client action.
revoke execute on function expire_stale_reservations() from anon, authenticated;