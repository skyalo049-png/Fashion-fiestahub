-- ============================================================================
-- 02 — enums
-- ============================================================================
-- Enums rather than free text: a typo in a status string is a silent bug that
-- only shows up when a query filters on it. These fail at write time instead.

-- The order lifecycle. `awaiting_delivery_quote` is the parked state every
-- order starts in: the customer has ordered, staff have not yet told them the
-- real delivery fee. Delivery is handwritten per order, so there is no zone
-- table and no fee to estimate up front.
--
--   awaiting_delivery_quote -> awaiting_payment -> paid -> processing -> shipped -> delivered
--            |                       |             |
--            +-----------------------+-------------+--> cancelled
create type order_status as enum (
  'awaiting_delivery_quote',
  'awaiting_payment',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
);

create type product_status as enum ('draft', 'active', 'archived');

-- Why stock moved. Every change to stock is one of these, and the sum of
-- `delta` for a variant is what reconciles against stock_qty.
create type movement_reason as enum (
  'reserve',     -- stock held by a newly placed order
  'release',     -- reservation released (expiry or cancellation)
  'sale',        -- order paid; reservation becomes a real deduction
  'adjustment',  -- manual correction by staff
  'restock'      -- new stock received
);

create type event_actor as enum ('customer', 'staff', 'system');