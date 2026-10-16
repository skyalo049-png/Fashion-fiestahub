-- ============================================================================
-- 11 — payment proof, and the merchandising fields the PDP needs
-- ============================================================================
-- Two additions, both required before the checkout phase can be built.
--
-- 1. The payment lifecycle had a hole. create_order parks an order at
--    awaiting_delivery_quote; staff move it to awaiting_payment once the
--    handwritten fee is known. But there was nowhere to record that a customer
--    had actually paid, and no status meaning "the customer says they paid and
--    staff have not checked yet". Manual M-Pesa needs exactly that state, plus
--    the proof to go with it.
--
-- 2. products carried a title and a description and nothing else. The product
--    detail page needs fabric, care, fit notes and a size chart — the P1
--    merchandising gap — and none of those columns existed.
--
-- The new enum value is added in THIS file and first referenced in 12.
-- Postgres permits ALTER TYPE ... ADD VALUE inside a transaction but forbids
-- using the new value in the same one, and each migration file is its own
-- transaction. The split across two files is required, not stylistic.

-- ---------------------------------------------------------------------------
-- order_status — insert the verification state into the lifecycle
-- ---------------------------------------------------------------------------
-- Positioned after awaiting_payment because that is where it sits in time:
--
--   awaiting_delivery_quote -> awaiting_payment -> awaiting_payment_verification
--                                                          |
--                                          paid -> processing -> shipped -> delivered
--
-- It is a distinct state from `paid` on purpose. `paid` means staff have seen
-- the money land. This means only that the customer has asserted it, and the
-- whole point is that those two things are not the same and must not share a
-- row value.
alter type order_status
  add value if not exists 'awaiting_payment_verification' after 'awaiting_payment';

-- ---------------------------------------------------------------------------
-- orders — the payment proof
-- ---------------------------------------------------------------------------
-- mpesa_code is what the customer reads off their M-Pesa SMS. It is supplied
-- by the customer, so it is a CLAIM, not evidence — nothing here verifies it
-- against Safaricom. It is stored raw and checked by a human against the
-- statement. The columns are named payment_* and not mpesa_* throughout except
-- for the one value the customer literally copies.
alter table orders
  add column if not exists mpesa_code           text,
  add column if not exists payment_phone        text,
  add column if not exists payment_submitted_at timestamptz,
  add column if not exists payment_verified_at  timestamptz,
  add column if not exists payment_verified_by  uuid references auth.users (id) on delete set null;

comment on column orders.mpesa_code is
  'Customer-asserted M-Pesa confirmation code. Unverified until staff confirm; may be wrong or reused, which is why it is unique below.';

comment on column orders.payment_phone is
  'The number the customer says they paid FROM. May differ from customers.phone — people pay from a second line. Stored separately for that reason.';

-- An M-Pesa confirmation code identifies one transaction globally. The same
-- code arriving on two orders means one of them is a replay — a customer
-- reusing a single payment to settle two baskets, deliberately or not. A
-- partial unique index makes the second insert fail at the database rather
-- than depending on a staff member noticing.
--
-- Deliberately NOT a check constraint tying status to mpesa_code being
-- present: the seed's historical orders are already `paid` from before this
-- column existed, and a NOT VALID constraint would be a lie dressed as a rule.
create unique index if not exists orders_mpesa_code_key
  on orders (mpesa_code)
  where mpesa_code is not null;

-- The verification-queue index that belongs here is created in 12, NOT here.
-- Its partial predicate is `status = 'awaiting_payment_verification'`, and
-- Postgres forbids referencing a value added by ALTER TYPE ... ADD VALUE in
-- the same transaction that added it — each migration file being one
-- transaction. Creating it here fails with SQLSTATE 55P04.

-- ---------------------------------------------------------------------------
-- products — PDP merchandising
-- ---------------------------------------------------------------------------
-- All nullable. A product is publishable without them; the PDP renders the
-- sections it has and omits the ones it does not, so a half-filled catalogue
-- degrades to a shorter page rather than a broken one.
alter table products
  add column if not exists fabric     text,
  add column if not exists care       text,
  add column if not exists fit_notes  text,
  add column if not exists size_chart jsonb;

comment on column products.fabric is
  'Composition, e.g. "100% cotton ankara, wax print". Free text — a taxonomy would be premature.';

comment on column products.care is
  'Washing and care instructions shown verbatim on the PDP.';

comment on column products.fit_notes is
  'How it sits on the body, and whether to size up. The question customers actually message about.';

comment on column products.size_chart is
  'Measurements as {"headers": [...], "rows": [[...]]}. jsonb because charts vary per garment — a fixed column set would fit the first product and not the third.';

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
-- New columns inherit the existing table grants and are covered by the row
-- policies on products in 07 — a draft product's fabric does not become
-- readable because the column is new.
