-- ============================================================================
-- 15 — variant identity, and the SKU prefix
-- ============================================================================
-- Two gaps that only matter once a human is typing variants into a form
-- instead of pasting a seed file.
--
-- 1. product_variants was unique on `sku` and nothing else. Nothing stopped a
--    second row for the same product being entered as M / Indigo — two rows,
--    two stock counts, two SKUs, and the PDP picks whichever the availability
--    view returns first. Pasted seed data never hit this. A form will.
--
-- 2. FFH-AWD — the product's SKU prefix — exists only inside the variant SKUs.
--    It is not a column anywhere, so a form generating SKUs has nothing to
--    generate them from and would have to ask for the prefix on every variant.

-- ---------------------------------------------------------------------------
-- (product_id, size, color) must be unique
-- ---------------------------------------------------------------------------
-- NULLS NOT DISTINCT (Postgres 15+) is the correct behaviour here, not a
-- convenience. By default Postgres treats every NULL as distinct, so a variant
-- with size IS NULL could be inserted any number of times and the constraint
-- would never fire — the exact duplicate it exists to catch. Two variants of
-- one product with no size and no colour are the same variant.
--
-- Verified safe to add: the live table has zero duplicate (product_id, size,
-- color) groups, so this validates immediately rather than failing.
alter table product_variants
  drop constraint if exists product_variants_identity_key;

alter table product_variants
  add constraint product_variants_identity_key
  unique nulls not distinct (product_id, size, color);

comment on constraint product_variants_identity_key on product_variants is
  'One row per product + size + colour. NULLS NOT DISTINCT so a variant with no size cannot be duplicated.';

-- ---------------------------------------------------------------------------
-- products.sku_prefix
-- ---------------------------------------------------------------------------
-- Backfilled from the existing SKUs before anything depends on it, so the
-- seeded variants keep exactly the SKUs they have today.
--
-- Derivation: drop the final two dash-separated segments (size code, colour
-- code). FFH-AWD-S-IND -> FFH-AWD, FFH-NLT-OS-TAN -> FFH-NLT.
--
-- One row per product, not per variant. Grouping by SKU would produce several
-- rows for the same product_id, and `update ... from` with multiple candidate
-- rows picks arbitrarily — which is harmless while every variant of a product
-- shares a prefix, and silently wrong the first time one does not. min() makes
-- it deterministic and documented rather than incidental.
alter table products
  add column if not exists sku_prefix text;

update products p
   set sku_prefix = sub.prefix
  from (
    select
      v.product_id,
      min(
        array_to_string(
          (string_to_array(v.sku, '-'))[1 : array_length(string_to_array(v.sku, '-'), 1) - 2],
          '-'
        )
      ) as prefix
    from product_variants v
    where v.sku is not null
      and array_length(string_to_array(v.sku, '-'), 1) >= 3
    group by v.product_id
  ) sub
 where p.id = sub.product_id
   and p.sku_prefix is null;

-- Deliberately NOT NULL is NOT added. A product with no variants yet cannot
-- have a prefix derived, and a product created as a draft shell with no
-- variants is a legitimate state — the form requires the prefix at the moment
-- the first variant is created, which is the only moment it is actually
-- needed. A NOT NULL here would reject the empty draft.

comment on column products.sku_prefix is
  'SKU stem, e.g. FFH-AWD. Variant SKUs are generated as prefix-SIZE-COLOR. NULL on a product with no variants yet.';

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
-- New column inherits the products grants and the existing row policies; a
-- draft product's sku_prefix does not become readable because the column is
-- new.