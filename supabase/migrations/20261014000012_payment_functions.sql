-- ============================================================================
-- 12 — manual M-Pesa: submit proof, verify, and the settlement write
-- ============================================================================
-- The lifecycle this implements, with the fee handwritten by staff:
--
--   1. checkout            create_order()            awaiting_delivery_quote
--   2. staff quote fee     (admin, later phase)      awaiting_payment
--   3. customer pays,
--      sends code          submit_payment_proof()    awaiting_payment_verification
--   4. staff check the
--      statement           verify_payment()          paid  (stock really moves)
--
-- Step 3 is a CLAIM. Nothing in this file talks to Safaricom; a customer can
-- type any ten characters. That is the honest version of the previous fiction,
-- and it is why step 3 and step 4 are different rows rather than one flag.
--
-- The new enum value was added in 11; it is first USED here. That split is
-- required — see the note at the top of 11.

-- ---------------------------------------------------------------------------
-- submit_payment_proof()
-- ---------------------------------------------------------------------------
-- Called by the customer from the order status page, unauthenticated. The
-- credential is phone + order number, the same pair lookup_order() uses, and
-- it is rate limited through the same lookup_attempts table for the same
-- reason: Kenyan mobile numbers are enumerable, so without a window this is a
-- brute-force oracle.
create or replace function submit_payment_proof(
  p_order_number  text,
  p_phone         text,
  p_mpesa_code    text,
  p_payment_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone    text;
  v_ip       inet;
  v_recent   integer;
  v_order    record;
  v_code     text;
  v_pay_from text;
begin
  v_phone := normalize_phone(p_phone);
  v_code  := upper(btrim(coalesce(p_mpesa_code, '')));

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

  -- Same window as lookup_order: 10 failures per IP per 15 minutes.
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

  -- M-Pesa confirmation codes are ten characters, letters and digits. Checking
  -- the shape here rejects the obvious junk before it reaches a staff queue,
  -- but it proves nothing — a well-formed code is still just a claim.
  if v_code !~ '^[A-Z0-9]{10}$' then
    insert into lookup_attempts (ip, order_number, succeeded)
    values (v_ip, p_order_number, false);
    raise exception 'invalid_code_format' using errcode = '22023';
  end if;

  select o.id, o.order_number, o.status
    into v_order
  from orders o
  join customers c on c.id = o.customer_id
  where c.phone = v_phone
    and o.order_number = btrim(p_order_number)
  for update of o;

  if not found then
    insert into lookup_attempts (ip, order_number, succeeded)
    values (v_ip, p_order_number, false);
    raise exception 'not_found' using errcode = '22023';
  end if;

  -- Only a quoted order can be paid. Re-submitting on an order already in
  -- verification, or already paid, is refused rather than silently accepted —
  -- otherwise a second code could overwrite the first before anyone looked.
  if v_order.status <> 'awaiting_payment' then
    insert into lookup_attempts (ip, order_number, succeeded)
    values (v_ip, p_order_number, false);
    raise exception 'wrong_status:%', v_order.status using errcode = '22023';
  end if;

  v_pay_from := coalesce(normalize_phone(p_payment_phone), v_phone);

  update orders
     set status                 = 'awaiting_payment_verification',
         mpesa_code             = v_code,
         payment_phone          = v_pay_from,
         payment_submitted_at   = now(),
         -- Staff are now the bottleneck, not the customer. The 48h clock that
         -- was running against the customer is replaced with one running
         -- against the queue, so a slow verification cannot expire an order
         -- the customer has already paid for.
         reservation_expires_at = now() + interval '72 hours'
   where id = v_order.id;

  insert into order_events (order_id, type, actor, payload, visible_to_customer)
  values (
    v_order.id, 'payment_submitted', 'customer',
    jsonb_build_object('mpesa_code', v_code, 'payment_phone', v_pay_from),
    true
  );

  insert into lookup_attempts (ip, order_number, succeeded)
  values (v_ip, p_order_number, true);

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'status',       'awaiting_payment_verification'
  );
end;
$$;

comment on function submit_payment_proof(text, text, text, text) is
  'Customer asserts an M-Pesa payment. Records the code as a CLAIM and moves the order to awaiting_payment_verification. Rate limited; does not verify.';

-- ---------------------------------------------------------------------------
-- verify_payment()
-- ---------------------------------------------------------------------------
-- Staff-only. This is where money becomes real and stock actually moves.
--
-- Why the stock write lives HERE and not in create_order: a reservation is
-- virtual. variant_availability subtracts open orders from stock_qty, so the
-- units are already spoken for without stock_qty changing. Decrementing at
-- reservation time would subtract the hold twice — once in the view, once in
-- the column — and the storefront would under-sell stock it actually has.
-- Confirming payment is the moment the hold becomes a real deduction, and the
-- only moment at which inventory_movements should record a `sale`.
create or replace function verify_payment(
  p_order_number text,
  p_approve      boolean,
  p_reason       text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order  record;
  v_item   record;
  v_status order_status;
begin
  if not is_staff() then
    raise exception 'not_staff' using errcode = '42501';
  end if;

  select id, order_number, status
    into v_order
  from orders
  where order_number = btrim(p_order_number)
  for update;

  if not found then
    raise exception 'not_found' using errcode = '22023';
  end if;

  if v_order.status <> 'awaiting_payment_verification' then
    raise exception 'wrong_status:%', v_order.status using errcode = '22023';
  end if;

  if p_approve then
    -- Deduct for real, and write the ledger row that makes the deduction
    -- auditable. Both happen together or neither does — the whole function is
    -- one transaction.
    for v_item in
      select oi.variant_id, oi.qty
      from order_items oi
      where oi.order_id = v_order.id
        and oi.variant_id is not null
    loop
      update product_variants
         set stock_qty = stock_qty - v_item.qty
       where id = v_item.variant_id;

      insert into inventory_movements (variant_id, delta, reason, order_id, note)
      values (
        v_item.variant_id, -v_item.qty, 'sale', v_order.id,
        'payment verified for ' || v_order.order_number
      );
    end loop;

    v_status := 'paid';

    update orders
       set status              = 'paid',
           payment_verified_at = now(),
           payment_verified_by = auth.uid()
     where id = v_order.id;

    insert into order_events (order_id, type, actor, payload, visible_to_customer)
    values (
      v_order.id, 'payment_verified', 'staff',
      jsonb_build_object('mpesa_code', (select mpesa_code from orders where id = v_order.id)),
      true
    );
  else
    -- Rejected: back to awaiting_payment so the customer can send the right
    -- code. The code is CLEARED, not kept — it is the wrong one, and leaving it
    -- would (a) hold the unique index against a customer who may re-send the
    -- same code after a staff error, and (b) leave a wrong code on the order
    -- for the next person to read.
    v_status := 'awaiting_payment';

    update orders
       set status               = 'awaiting_payment',
           mpesa_code           = null,
           payment_submitted_at = null,
           reservation_expires_at = now() + interval '48 hours'
     where id = v_order.id;

    insert into order_events (order_id, type, actor, payload, visible_to_customer)
    values (
      v_order.id, 'payment_rejected', 'staff',
      jsonb_build_object('reason', coalesce(nullif(btrim(p_reason), ''), 'not matched on statement')),
      true
    );
  end if;

  return jsonb_build_object('order_number', v_order.order_number, 'status', v_status);
end;
$$;

comment on function verify_payment(text, boolean, text) is
  'Staff confirms or rejects a claimed M-Pesa payment. On approval, deducts stock and writes sale movements — the only place a sale is recorded.';

-- ---------------------------------------------------------------------------
-- variant_availability — count the new state as a hold
-- ---------------------------------------------------------------------------
-- REQUIRED, not cosmetic. The moment an order enters
-- awaiting_payment_verification, its units must still be subtracted from
-- availability. If they were not, the hold would silently release the instant
-- the customer paid and before staff confirmed — and a second buyer could take
-- the dress out from under someone who has already sent money for it. That is
-- the precise failure this view exists to prevent, so the status list is
-- extended rather than left alone.
create or replace view variant_availability as
select
  v.id                                        as variant_id,
  v.product_id,
  v.sku,
  v.size,
  v.color,
  v.price_kes,
  v.stock_qty,
  coalesce(r.reserved_qty, 0)::integer        as reserved_qty,
  (v.stock_qty - coalesce(r.reserved_qty, 0))::integer as available_qty
from product_variants v
join products p
  on p.id = v.product_id
 and p.status = 'active'
left join (
  select
    oi.variant_id,
    sum(oi.qty) as reserved_qty
  from order_items oi
  join orders o on o.id = oi.order_id
  where oi.variant_id is not null
    -- Open, unexpired, and not yet paid for. `paid` and beyond are a real
    -- deduction taken in verify_payment() and are no longer a hold.
    and o.status in (
      'awaiting_delivery_quote',
      'awaiting_payment',
      'awaiting_payment_verification'
    )
    and o.reservation_expires_at > now()
  group by oi.variant_id
) r on r.variant_id = v.id
where v.is_active;

comment on view variant_availability is
  'Sellable quantity per variant. Runs with owner rights deliberately: anon has no policy on orders, so a caller-invoker view would report reserved_qty = 0 and OVERSTATE availability.';

-- ---------------------------------------------------------------------------
-- expire_stale_reservations() — unchanged behaviour, extended guard
-- ---------------------------------------------------------------------------
-- Deliberately still limited to awaiting_delivery_quote and awaiting_payment.
-- An order in awaiting_payment_verification is NOT swept, even once its window
-- lapses, because the customer has asserted they paid and auto-cancelling them
-- is the worse failure. Such an order stays in the staff queue, visibly
-- overdue, for a human to resolve. Stated here so the omission reads as a
-- decision rather than an oversight.
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

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
-- The customer calls submit_payment_proof from an unauthenticated session.
grant execute on function submit_payment_proof(text, text, text, text) to anon, authenticated;

-- verify_payment is staff-only; the is_staff() check inside is the real gate,
-- but revoking from anon means an unauthenticated caller cannot even reach it.
revoke execute on function verify_payment(text, boolean, text) from anon;
grant  execute on function verify_payment(text, boolean, text) to authenticated;