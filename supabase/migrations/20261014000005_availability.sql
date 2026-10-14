-- ============================================================================
-- 05 — availability
-- ============================================================================
-- One derived number the storefront can trust: how many units of a variant
-- can actually be sold right now.
--
-- The model, stated once so it does not drift:
--
--   stock_qty    physical on-hand count. Changed ONLY by restock, adjustment
--                and sale. This is what sum(inventory_movements.delta) equals.
--
--   reserved_qty units held by orders that are open and not yet expired.
--                DERIVED from order_items. Never stored on the variant, so it
--                cannot go stale when an order is cancelled or a reservation
--                lapses.
--
--   available    stock_qty - reserved_qty. The only number checkout may use.
--
-- Because reservations are derived, placing an order writes NO inventory_movement
-- row: no stock physically moved. The ledger stays a ledger of real stock
-- changes, and the two views of the world cannot disagree.

-- ---------------------------------------------------------------------------
-- Why this view runs as its OWNER, not as the caller (no security_invoker)
-- ---------------------------------------------------------------------------
-- A caller-invoker view would be wrong here, and subtly so. Reservations live
-- in order_items and orders, which have NO anon policy at all (see 07). An
-- anon query of this view would therefore see zero of those rows and report
-- reserved_qty = 0 — overstating availability, so a customer could add three
-- units that are really reserved and only be told at checkout.
--
-- Running as owner lets the view count reservations correctly for everyone.
-- The compensating control is moved INTO the view: it now joins `products`
-- itself and requires `status = 'active'`, so a draft product's variants can
-- never appear even though RLS is bypassed. What the view exposes is a stock
-- count for products that are already publicly listed — nothing sensitive.
--
-- The authoritative stock check on checkout does not rely on this: create_order
-- is security definer and re-reads the variant row FOR UPDATE (see 08).

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
    -- deduction and are no longer a hold.
    and o.status in ('awaiting_delivery_quote', 'awaiting_payment')
    and o.reservation_expires_at > now()
  group by oi.variant_id
) r on r.variant_id = v.id
where v.is_active;

comment on view variant_availability is
  'Sellable stock per variant: stock_qty minus unexpired reservations. Owner-rights view; drafts excluded by explicit join.';
