-- Checkout asks for a town and delivery notes, not a full postal address.
--
-- The original form asked for street, apartment, area, town and county. In
-- practice that produced rows like (line1='nakuru', area='nakuru',
-- city='nakuru', county='nakuru') — the same word typed five times, because a
-- customer in Nakuru does not have a street address to give and will satisfy a
-- required field with whatever is nearest to hand. Five fields of ceremony for
-- one fact, and the fact was still just "Nakuru".
--
-- What staff actually need to quote delivery is the town, plus whatever helps
-- a rider find the gate. The town goes in addresses.city; the rest goes in
-- orders.notes, where the customer can write "Milimani, gate 4, call on
-- arrival" in one go instead of distributing it across four boxes.
--
-- line1 was `not null`, which encoded an assumption this shop does not hold:
-- that every customer can name a street and building number. It becomes
-- optional. Nothing is dropped — line2, area and county remain, the seed still
-- populates them, and a future version may ask for them again.

alter table addresses alter column line1 drop not null;

comment on column addresses.line1 is
  'Street address. Optional since checkout asks only for a town plus delivery notes.';

-- ---------------------------------------------------------------------------
-- create_order(): address now carries a town, not five fields
-- ---------------------------------------------------------------------------
-- Signature and behaviour are otherwise unchanged. Only the addresses insert
-- differs: it reads city and nothing else from p_address. A client that still
-- sends line1/line2/area/county has them ignored rather than rejected, so an
-- older open tab cannot fail at the last step of checkout.

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

  -- The town, and only the town. Delivery specifics live in orders.notes.
  insert into addresses (customer_id, label, city, phone, is_default)
  values (
    v_customer_id,
    'checkout',
    nullif(btrim(coalesce(p_address->>'city', '')), ''),
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
  'Creates an order with server-computed prices. Client-supplied money is ignored. Delivery fee and total stay NULL until staff confirm. Address carries a town; delivery specifics arrive in p_notes.';

-- CREATE OR REPLACE preserves existing grants, but re-stating them keeps this
-- migration readable on its own and guards against the function being dropped
-- and recreated by hand in between.
grant execute on function create_order(text, text, text, jsonb, jsonb, text)
  to anon, authenticated;