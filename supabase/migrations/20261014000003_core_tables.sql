-- ============================================================================
-- 03 — core tables
-- ============================================================================
-- The whole point of this rebuild: one home for each fact, so the storefront
-- and the admin dashboard read the same rows instead of two hardcoded fixtures
-- kept in sync by hand.
--
-- All money is `integer` whole Kenyan shillings. M-Pesa transacts in whole
-- shillings and every price in the catalogue is whole; a float here would be a
-- defect, not a refinement.

-- ---------------------------------------------------------------------------
-- updated_at maintenance, defined once and reused by every table that has one
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- catalogue
-- ---------------------------------------------------------------------------

-- No price and no stock on products. Those live on variants, and only on
-- variants, so there is exactly one row to update when a price changes.
create table products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text,
  status      product_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index products_status_idx on products (status);

create table product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products (id) on delete cascade,
  sku         text not null unique,
  size        text,
  color       text,
  price_kes   integer not null check (price_kes >= 0),
  stock_qty   integer not null default 0 check (stock_qty >= 0),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index product_variants_product_id_idx on product_variants (product_id);

create table product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  -- An image may belong to one variant (a specific colourway) or to the
  -- product generally. Null = general.
  variant_id uuid references product_variants (id) on delete cascade,
  url        text not null,
  alt        text,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on product_images (product_id, position);

create table collections (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create table collection_products (
  collection_id uuid not null references collections (id) on delete cascade,
  product_id    uuid not null references products (id) on delete cascade,
  position      integer not null default 0,
  primary key (collection_id, product_id)
);

create index collection_products_product_id_idx on collection_products (product_id);

-- ---------------------------------------------------------------------------
-- customers and addresses
-- ---------------------------------------------------------------------------
-- Guest checkout: there is no auth.users row for a customer. Identity is
-- phone + order number, verified server-side. `phone` is stored normalised to
-- E.164 by normalize_phone() (see 06_rls_helpers) so that 0712…, +254712… and
-- 254712… are one row, not three.
create table customers (
  id         uuid primary key default gen_random_uuid(),
  phone      text not null unique,
  full_name  text,
  email      text,
  created_at timestamptz not null default now()
);

create table addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  label       text,
  line1       text not null,
  line2       text,
  city        text,
  area        text,
  county      text,
  phone       text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index addresses_customer_id_idx on addresses (customer_id);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
-- Two identities, deliberately:
--   id           bigserial  — internal, never exposed to a client
--   order_number text       — public, random, set by trigger (see 04)
--
-- No delivery_zones table. Delivery is handwritten per order by staff, so
-- delivery_fee_kes and total_kes are NULL until a human confirms them. The
-- customer is shown the subtotal and told the fee follows.
create table orders (
  id                     bigserial primary key,
  order_number           text not null unique,
  customer_id            uuid not null references customers (id) on delete restrict,
  address_id             uuid references addresses (id) on delete set null,
  status                 order_status not null default 'awaiting_delivery_quote',
  subtotal_kes           integer not null default 0 check (subtotal_kes >= 0),
  delivery_fee_kes       integer check (delivery_fee_kes >= 0),
  total_kes              integer check (total_kes >= 0),
  notes                  text,
  reservation_expires_at timestamptz not null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index orders_customer_id_idx on orders (customer_id);
create index orders_status_idx on orders (status);
create index orders_reservation_expires_at_idx on orders (reservation_expires_at)
  where status in ('awaiting_delivery_quote', 'awaiting_payment');

-- Order history is immutable. These snapshot columns are the whole reason the
-- storefront and admin dashboard can no longer disagree: nothing in the order
-- path reads live product data, so editing a product title or price tomorrow
-- cannot rewrite what someone bought today.
--
-- variant_id is ON DELETE SET NULL, never CASCADE. Deleting a variant must not
-- delete the order lines that reference it.
create table order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        bigint not null references orders (id) on delete cascade,
  variant_id      uuid references product_variants (id) on delete set null,
  title_snapshot  text not null,
  sku_snapshot    text not null,
  size_snapshot   text,
  color_snapshot  text,
  unit_price_kes  integer not null check (unit_price_kes >= 0),
  qty             integer not null check (qty > 0),
  line_total_kes  integer not null check (line_total_kes >= 0),
  created_at      timestamptz not null default now()
);

create index order_items_order_id_idx on order_items (order_id);
create index order_items_variant_id_idx on order_items (variant_id);

-- visible_to_customer lets the public lookup RPC return a status timeline
-- without leaking internal staff notes.
create table order_events (
  id                  uuid primary key default gen_random_uuid(),
  order_id            bigint not null references orders (id) on delete cascade,
  type                text not null,
  actor               event_actor not null default 'system',
  payload             jsonb not null default '{}'::jsonb,
  visible_to_customer boolean not null default true,
  created_at          timestamptz not null default now()
);

create index order_events_order_id_idx on order_events (order_id, created_at);

-- The audit trail for stock. Never mutated, only appended.
create table inventory_movements (
  id         uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants (id) on delete cascade,
  delta      integer not null,
  reason     movement_reason not null,
  order_id   bigint references orders (id) on delete set null,
  note       text,
  created_at timestamptz not null default now()
);

create index inventory_movements_variant_id_idx on inventory_movements (variant_id, created_at);

-- ---------------------------------------------------------------------------
-- staff
-- ---------------------------------------------------------------------------
-- Membership here is what is_staff() checks, and what every staff RLS policy
-- hangs off. Middleware may redirect /admin, but a forged request that skips
-- middleware still hits RLS and finds no staff row.
create table staff (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'staff',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- lookup rate limiting
-- ---------------------------------------------------------------------------
-- lookup_order() is a credential check (phone + order number). Kenyan mobile
-- numbers are enumerable, so the RPC needs a per-IP window or it is a
-- brute-force oracle. No Redis needed at this scale.
create table lookup_attempts (
  id           bigserial primary key,
  ip           inet,
  order_number text,
  succeeded    boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index lookup_attempts_ip_time_idx on lookup_attempts (ip, attempted_at);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

create trigger product_variants_set_updated_at
  before update on product_variants
  for each row execute function set_updated_at();

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();