-- ============================================================================
-- seed — local development only
-- ============================================================================
-- NOT a migration. This file is loaded by `supabase db reset` and nothing else.
--
-- It used to live in supabase/migrations/ as 09_seed.sql, which was wrong in a
-- way that mattered: `supabase db push` replays every file in migrations/
-- against the hosted database. Shipping it there would have written the
-- fabricated products, customers and orders below into production as
-- unrepeatable migration history.
--
-- Supabase's split is schema in migrations/, data in seed.sql. Keep it that way:
-- if this data needs to exist on a hosted project, it is a migration, not a seed.
--
-- Runs as the postgres superuser, so RLS does not apply here. Everything below
-- is idempotent-by-reset: `db reset` drops the database first, so there is no
-- need for ON CONFLICT guards. Do not run it against a database holding real
-- data.
--
-- No delivery_zones rows: there is no fee table. Staff write the fee per order.
--
-- The seeded order history is deliberately NOT consistent with the current
-- catalogue prices. That is the fixture, not a mistake — see the note on
-- order 2 below.

-- ---------------------------------------------------------------------------
-- catalogue — 8 products, variants, images
-- ---------------------------------------------------------------------------
-- Prices are whole KSh, as everywhere else.

insert into products (id, slug, title, description, status) values
  ('11111111-1111-4111-8111-111111111111', 'ankara-wrap-dress',
   'Ankara Wrap Dress',
   'Hand-tailored wrap dress in wax-print cotton. Adjustable tie waist, midi length.',
   'active'),
  ('11111111-1111-4111-8111-111111111112', 'kitenge-maxi-skirt',
   'Kitenge Maxi Skirt',
   'High-waisted maxi in heavyweight kitenge. Concealed side zip, lined.',
   'active'),
  ('11111111-1111-4111-8111-111111111113', 'kikoi-beach-coverup',
   'Kikoi Beach Cover-Up',
   'Lightweight cotton kikoi throw-over with fringed hem. One size.',
   'active'),
  ('11111111-1111-4111-8111-111111111114', 'maasai-bead-necklace',
   'Maasai Bead Necklace',
   'Hand-beaded collar necklace on leather. Made in Kajiado.',
   'active'),
  ('11111111-1111-4111-8111-111111111115', 'shuka-blanket-shawl',
   'Shuka Blanket Shawl',
   'Traditional shuka wool-blend shawl in red and blue check.',
   'active'),
  ('11111111-1111-4111-8111-111111111116', 'leather-tote-nairobi',
   'Nairobi Leather Tote',
   'Vegetable-tanned leather tote, unlined, hand-stitched in Nairobi.',
   'active'),
  ('11111111-1111-4111-8111-111111111117', 'cotton-headwrap',
   'Cotton Headwrap',
   'Two-metre cotton headwrap in assorted prints. Pre-washed.',
   'active'),
  ('11111111-1111-4111-8111-111111111118', 'linen-wide-leg-trouser',
   'Linen Wide-Leg Trouser',
   'Relaxed wide-leg trouser in washed linen. Elasticated back waist.',
   'draft');

-- The draft product above has variants but must be invisible to anon — that is
-- one of the RLS checks in Phase 3.
insert into product_variants (id, product_id, sku, size, color, price_kes, stock_qty) values
  -- Ankara Wrap Dress
  ('22222222-2222-4222-8222-222222220001', '11111111-1111-4111-8111-111111111111',
   'FFH-AWD-S-IND', 'S',  'Indigo',  4500, 4),
  ('22222222-2222-4222-8222-222222220002', '11111111-1111-4111-8111-111111111111',
   'FFH-AWD-M-IND', 'M',  'Indigo',  4500, 6),
  ('22222222-2222-4222-8222-222222220003', '11111111-1111-4111-8111-111111111111',
   'FFH-AWD-L-IND', 'L',  'Indigo',  4500, 2),
  ('22222222-2222-4222-8222-222222220004', '11111111-1111-4111-8111-111111111111',
   'FFH-AWD-M-RUS', 'M',  'Rust',    4500, 3),
  -- Kitenge Maxi Skirt
  ('22222222-2222-4222-8222-222222220005', '11111111-1111-4111-8111-111111111112',
   'FFH-KMS-S-GRN', 'S',  'Green',   3800, 5),
  ('22222222-2222-4222-8222-222222220006', '11111111-1111-4111-8111-111111111112',
   'FFH-KMS-M-GRN', 'M',  'Green',   3800, 7),
  ('22222222-2222-4222-8222-222222220007', '11111111-1111-4111-8111-111111111112',
   'FFH-KMS-L-GRN', 'L',  'Green',   3800, 0),
  -- Kikoi Beach Cover-Up
  ('22222222-2222-4222-8222-222222220008', '11111111-1111-4111-8111-111111111113',
   'FFH-KBC-OS-NAT', 'One Size', 'Natural', 2200, 12),
  -- Maasai Bead Necklace
  ('22222222-2222-4222-8222-222222220009', '11111111-1111-4111-8111-111111111114',
   'FFH-MBN-OS-RED', 'One Size', 'Red',     1800, 9),
  ('22222222-2222-4222-8222-22222222000a', '11111111-1111-4111-8111-111111111114',
   'FFH-MBN-OS-BLU', 'One Size', 'Blue',    1800, 6),
  -- Shuka Blanket Shawl
  ('22222222-2222-4222-8222-22222222000b', '11111111-1111-4111-8111-111111111115',
   'FFH-SBS-OS-RED', 'One Size', 'Red Check', 3500, 4),
  -- Nairobi Leather Tote
  ('22222222-2222-4222-8222-22222222000c', '11111111-1111-4111-8111-111111111116',
   'FFH-NLT-OS-TAN', 'One Size', 'Tan',     6500, 3),
  ('22222222-2222-4222-8222-22222222000d', '11111111-1111-4111-8111-111111111116',
   'FFH-NLT-OS-BLK', 'One Size', 'Black',   6500, 2),
  -- Cotton Headwrap
  ('22222222-2222-4222-8222-22222222000e', '11111111-1111-4111-8111-111111111117',
   'FFH-CHW-OS-AST', 'One Size', 'Assorted', 900, 20),
  -- Linen Wide-Leg Trouser (draft product)
  ('22222222-2222-4222-8222-22222222000f', '11111111-1111-4111-8111-111111111118',
   'FFH-LWT-M-SND', 'M', 'Sand', 4200, 5);

-- Placeholder image URLs. Replace with real uploads before launch; the schema
-- cares only that the rows exist and are ordered.
insert into product_images (product_id, variant_id, url, alt, position) values
  ('11111111-1111-4111-8111-111111111111', null, '/images/ankara-wrap-dress-1.jpg', 'Ankara Wrap Dress, front', 0),
  ('11111111-1111-4111-8111-111111111111', null, '/images/ankara-wrap-dress-2.jpg', 'Ankara Wrap Dress, detail', 1),
  ('11111111-1111-4111-8111-111111111112', null, '/images/kitenge-maxi-skirt-1.jpg', 'Kitenge Maxi Skirt, front', 0),
  ('11111111-1111-4111-8111-111111111113', null, '/images/kikoi-beach-coverup-1.jpg', 'Kikoi Beach Cover-Up, front', 0),
  ('11111111-1111-4111-8111-111111111114', null, '/images/maasai-bead-necklace-1.jpg', 'Maasai Bead Necklace, front', 0),
  ('11111111-1111-4111-8111-111111111115', null, '/images/shuka-blanket-shawl-1.jpg', 'Shuka Blanket Shawl, front', 0),
  ('11111111-1111-4111-8111-111111111116', null, '/images/nairobi-leather-tote-1.jpg', 'Nairobi Leather Tote, front', 0),
  ('11111111-1111-4111-8111-111111111117', null, '/images/cotton-headwrap-1.jpg', 'Cotton Headwrap, front', 0),
  ('11111111-1111-4111-8111-111111111118', null, '/images/linen-wide-leg-trouser-1.jpg', 'Linen Wide-Leg Trouser, front', 0);

-- ---------------------------------------------------------------------------
-- collections
-- ---------------------------------------------------------------------------

insert into collections (id, slug, title, description, position) values
  ('33333333-3333-4333-8333-333333333331', 'new-in',       'New In',       'The latest arrivals.', 0),
  ('33333333-3333-4333-8333-333333333332', 'nairobi-made', 'Nairobi Made', 'Made by hand in Nairobi.', 1),
  ('33333333-3333-4333-8333-333333333333', 'under-2000',   'Under KSh 2,000', 'Everyday pieces.', 2);

-- The draft product is deliberately NOT in any collection, so it cannot leak
-- through a collection join either.
insert into collection_products (collection_id, product_id, position) values
  ('33333333-3333-4333-8333-333333333331', '11111111-1111-4111-8111-111111111117', 0),
  ('33333333-3333-4333-8333-333333333331', '11111111-1111-4111-8111-111111111116', 1),
  ('33333333-3333-4333-8333-333333333332', '11111111-1111-4111-8111-111111111116', 0),
  ('33333333-3333-4333-8333-333333333332', '11111111-1111-4111-8111-111111111114', 1),
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111117', 0),
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111114', 1);

-- ---------------------------------------------------------------------------
-- customers and order history
-- ---------------------------------------------------------------------------

insert into customers (id, phone, full_name, email) values
  ('44444444-4444-4444-8444-444444444441', '+254712000001', 'Wanjiru Kamau',  'wanjiru@example.com'),
  ('44444444-4444-4444-8444-444444444442', '+254712000002', 'Achieng Otieno', 'achieng@example.com'),
  ('44444444-4444-4444-8444-444444444443', '+254712000003', 'Fatuma Hassan',  null);

insert into addresses (id, customer_id, label, line1, area, city, county, phone, is_default) values
  ('55555555-5555-4555-8555-555555555551', '44444444-4444-4444-8444-444444444441',
   'home', 'Kilimani Apartments, Block C', 'Kilimani', 'Nairobi', 'Nairobi', '+254712000001', true),
  ('55555555-5555-4555-8555-555555555552', '44444444-4444-4444-8444-444444444442',
   'home', 'Nyali Road 14', 'Nyali', 'Mombasa', 'Mombasa', '+254712000002', true),
  ('55555555-5555-4555-8555-555555555553', '44444444-4444-4444-8444-444444444443',
   'home', 'Milimani Estate', 'Milimani', 'Nakuru', 'Nakuru', '+254712000003', true);

-- order_number is supplied explicitly here so the seed is reproducible and the
-- Phase 3 lookup checks have a fixed value to hit. In the app it is always
-- minted by the trigger — nothing in application code passes one.
--
-- Order 1 — still awaiting a delivery quote. delivery_fee_kes and total_kes are
--   NULL, exactly as a real unconfirmed order would be.
insert into orders (id, order_number, customer_id, address_id, status,
                    subtotal_kes, delivery_fee_kes, total_kes, notes,
                    reservation_expires_at, created_at) values
  (1, 'FFH-SEED000001', '44444444-4444-4444-8444-444444444441',
   '55555555-5555-4555-8555-555555555551', 'awaiting_delivery_quote',
   8300, null, null, 'Please call before delivery.',
   now() + interval '40 hours', now() - interval '8 hours');

insert into order_items (order_id, variant_id, title_snapshot, sku_snapshot,
                         size_snapshot, color_snapshot, unit_price_kes, qty, line_total_kes)
values
  (1, '22222222-2222-4222-8222-222222220002', 'Ankara Wrap Dress', 'FFH-AWD-M-IND',
   'M', 'Indigo', 4500, 1, 4500),
  (1, '22222222-2222-4222-8222-222222220006', 'Kitenge Maxi Skirt', 'FFH-KMS-M-GRN',
   'M', 'Green', 3800, 1, 3800);

-- Order 2 — DELIBERATELY inconsistent with the live catalogue.
--
-- The unit price below is 4,000, but FFH-AWD-M-IND now costs 4,500 (see the
-- product_variants insert above). This is the regression fixture for the
-- whole rebuild: an order placed in the past must keep the price the customer
-- actually paid, no matter what staff change the catalogue to later. If a
-- future refactor makes the order page join to product_variants for its
-- price, this row is what catches it.
--
-- Delivered, so the money columns are filled in by staff.
insert into orders (id, order_number, customer_id, address_id, status,
                    subtotal_kes, delivery_fee_kes, total_kes, notes,
                    reservation_expires_at, created_at) values
  (2, 'FFH-SEED000002', '44444444-4444-4444-8444-444444444442',
   '55555555-5555-4555-8555-555555555552', 'delivered',
   4000, 350, 4350, null,
   now() - interval '20 days', now() - interval '22 days');

insert into order_items (order_id, variant_id, title_snapshot, sku_snapshot,
                         size_snapshot, color_snapshot, unit_price_kes, qty, line_total_kes)
values
  (2, '22222222-2222-4222-8222-222222220002', 'Ankara Wrap Dress', 'FFH-AWD-M-IND',
   'M', 'Indigo', 4000, 1, 4000);

-- Order 3 — cancelled before payment, so no money was ever set.
insert into orders (id, order_number, customer_id, address_id, status,
                    subtotal_kes, delivery_fee_kes, total_kes, notes,
                    reservation_expires_at, created_at) values
  (3, 'FFH-SEED000003', '44444444-4444-4444-8444-444444444443',
   '55555555-5555-4555-8555-555555555553', 'cancelled',
   6500, null, null, null,
   now() - interval '5 days', now() - interval '7 days');

insert into order_items (order_id, variant_id, title_snapshot, sku_snapshot,
                         size_snapshot, color_snapshot, unit_price_kes, qty, line_total_kes)
values
  (3, '22222222-2222-4222-8222-22222222000c', 'Nairobi Leather Tote', 'FFH-NLT-OS-TAN',
   'One Size', 'Tan', 6500, 1, 6500);

-- Keep the id sequence ahead of the hand-written ids above, so the next real
-- order does not collide with the seed.
select setval(pg_get_serial_sequence('orders', 'id'), (select max(id) from orders));

insert into order_events (order_id, type, actor, payload, visible_to_customer) values
  (1, 'order_placed',        'customer', '{"subtotal_kes": 8300}', true),
  (2, 'order_placed',        'customer', '{"subtotal_kes": 4000}', true),
  (2, 'quote_confirmed',     'staff',    '{"delivery_fee_kes": 350}', true),
  (2, 'payment_received',    'staff',    '{"method": "mpesa"}', true),
  (2, 'shipped',             'staff',    '{}', true),
  (2, 'delivered',           'staff',    '{}', true),
  (3, 'order_placed',        'customer', '{"subtotal_kes": 6500}', true),
  (3, 'cancelled',           'staff',    '{"reason": "customer changed mind"}', true),
  -- Internal-only note: must NOT appear in lookup_order() output.
  (3, 'note_added',          'staff',    '{"note": "customer disputed delivery fee"}', false);

-- ---------------------------------------------------------------------------
-- inventory ledger
-- ---------------------------------------------------------------------------
-- Reconciled so that, for every variant:
--
--     stock_qty = sum(inventory_movements.delta)
--
-- That invariant is the whole point of the ledger. Rather than hand-write
-- movements that could drift from the numbers above, this block derives them:
-- a `restock` bringing stock up to (current stock + whatever has been sold),
-- then a `sale` for each unit in a delivered order.
--
-- Reservations (order 1, still open) intentionally produce NO movement: no
-- stock physically moved, so the ledger stays a record of real changes only.

insert into inventory_movements (variant_id, delta, reason, order_id, note)
select
  v.id,
  v.stock_qty + coalesce(sold.qty, 0),
  'restock',
  null,
  'seed: opening stock'
from product_variants v
left join (
  select oi.variant_id, sum(oi.qty)::integer as qty
  from order_items oi
  join orders o on o.id = oi.order_id
  where o.status = 'delivered'
  group by oi.variant_id
) sold on sold.variant_id = v.id;

insert into inventory_movements (variant_id, delta, reason, order_id, note)
select
  oi.variant_id,
  -oi.qty,
  'sale',
  o.id,
  'seed: order ' || o.order_number
from order_items oi
join orders o on o.id = oi.order_id
where o.status = 'delivered'
  and oi.variant_id is not null;

-- ---------------------------------------------------------------------------
-- staff
-- ---------------------------------------------------------------------------
-- There is no auth.users row on a fresh `db reset` — Supabase creates those
-- through GoTrue, not migrations. So this attaches a staff row to whichever
-- auth user already exists, and quietly does nothing when none does.
--
-- To create your admin user:
--
--   1. npm run dev, open http://localhost:3000
--   2. sign up (or Supabase Studio -> Authentication -> Add user)
--   3. re-run just this block, or from the SQL editor:
--
--        insert into staff (user_id, role)
--        select id, 'owner' from auth.users
--        where email = 'you@example.com';
--
-- Without a staff row, every /admin query returns zero rows — the correct
-- failure direction, and the reason this is safe to leave empty.
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users order by created_at limit 1;

  if v_user_id is null then
    raise notice 'seed: no auth.users row yet — staff table left empty. See the comment above to add one.';
  else
    insert into staff (user_id, role) values (v_user_id, 'owner');
    raise notice 'seed: granted staff (owner) to auth user %', v_user_id;
  end if;
end;
$$;
