-- ============================================================================
-- 07 — row level security
-- ============================================================================
-- The structural fix for client PII sitting in the browser: the anon key is
-- public by design, so every table must be safe to query with it.
--
-- Rule applied throughout: enable RLS on EVERY table, then grant explicitly.
-- A table with RLS on and no policy returns zero rows, which is the correct
-- failure direction. The alternative — RLS off — returns everything.
--
-- Deliberately absent: any anon policy on customers, addresses, orders,
-- order_items, order_events, inventory_movements or lookup_attempts. The
-- storefront reads none of them directly. Order status reaches a customer only
-- through lookup_order(), which is a controlled security-definer function.

alter table products            enable row level security;
alter table product_variants    enable row level security;
alter table product_images      enable row level security;
alter table collections         enable row level security;
alter table collection_products enable row level security;
alter table customers           enable row level security;
alter table addresses           enable row level security;
alter table orders              enable row level security;
alter table order_items         enable row level security;
alter table order_events        enable row level security;
alter table inventory_movements enable row level security;
alter table staff               enable row level security;
alter table lookup_attempts     enable row level security;

-- ---------------------------------------------------------------------------
-- catalogue — public read of live products, staff write
-- ---------------------------------------------------------------------------

create policy products_public_read on products
  for select to anon, authenticated
  using (status = 'active');

create policy products_staff_all on products
  for all to authenticated
  using (is_staff()) with check (is_staff());

-- Variants and images inherit visibility from their product: a variant of a
-- draft product must not be readable just because the variant row itself has
-- no status column.
create policy product_variants_public_read on product_variants
  for select to anon, authenticated
  using (
    is_active and exists (
      select 1 from products p
      where p.id = product_variants.product_id and p.status = 'active'
    )
  );

create policy product_variants_staff_all on product_variants
  for all to authenticated
  using (is_staff()) with check (is_staff());

create policy product_images_public_read on product_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from products p
      where p.id = product_images.product_id and p.status = 'active'
    )
  );

create policy product_images_staff_all on product_images
  for all to authenticated
  using (is_staff()) with check (is_staff());

-- Collections are merchandising, not stock — browsing one reveals only which
-- active products are in it, which the public read on products already allows.
create policy collections_public_read on collections
  for select to anon, authenticated
  using (true);

create policy collections_staff_all on collections
  for all to authenticated
  using (is_staff()) with check (is_staff());

-- The public read here is filtered by the SAME product-status join, so a draft
-- product cannot be discovered by walking the join table.
create policy collection_products_public_read on collection_products
  for select to anon, authenticated
  using (
    exists (
      select 1 from products p
      where p.id = collection_products.product_id and p.status = 'active'
    )
  );

create policy collection_products_staff_all on collection_products
  for all to authenticated
  using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------------
-- customers / addresses — staff only, and no anon surface at all
-- ---------------------------------------------------------------------------
-- These hold the PII the old app shipped to the browser. A customer reaches
-- their own order through lookup_order() (phone + order number), never by
-- querying this table.

create policy customers_staff_all on customers
  for all to authenticated
  using (is_staff()) with check (is_staff());

create policy addresses_staff_all on addresses
  for all to authenticated
  using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------------
-- orders and their history — staff only
-- ---------------------------------------------------------------------------
-- No anon policy anywhere below. This is the Phase 3 check that
-- `select * from orders` as anon returns ZERO rows.

create policy orders_staff_all on orders
  for all to authenticated
  using (is_staff()) with check (is_staff());

create policy order_items_staff_all on order_items
  for all to authenticated
  using (is_staff()) with check (is_staff());

create policy order_events_staff_all on order_events
  for all to authenticated
  using (is_staff()) with check (is_staff());

create policy inventory_movements_staff_all on inventory_movements
  for all to authenticated
  using (is_staff()) with check (is_staff());

create policy lookup_attempts_staff_all on lookup_attempts
  for all to authenticated
  using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------------
-- staff
-- ---------------------------------------------------------------------------
-- A staff member may read their OWN row (middleware needs exactly that to
-- answer "is this user staff?"). They may not enumerate the team, and they may
-- not insert themselves — that would make the gate self-service.

create policy staff_read_self on staff
  for select to authenticated
  using (user_id = auth.uid() or is_staff());

-- No insert/update/delete policy: staff membership is changed by a migration or
-- by the service role, never from a browser session.
