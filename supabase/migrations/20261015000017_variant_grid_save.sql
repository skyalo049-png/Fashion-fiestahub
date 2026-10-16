-- ============================================================================
-- 17 — the variant grid save
-- ============================================================================
-- The grid is the thing that was actually asked for: type your colours and
-- sizes, fill the cells, save once. Doing that from the app would be a loop of
-- inserts, updates and set_variant_stock() calls — fifteen round trips for a
-- 3x4 grid, any of which can fail on its own, leaving a product half-saved and
-- the ledger disagreeing with the table.
--
-- So it is one function, one transaction. Either the whole grid lands or none
-- of it does.
--
-- Two rules this function exists to keep:
--
--   1. Nothing is DELETED. inventory_movements.variant_id is ON DELETE CASCADE,
--      so deleting a variant erases its stock history — the audit trail of what
--      was sold. A cell that is cleared sets is_active = false instead, which
--      hides the variant from the storefront and keeps every ledger row.
--
--   2. Every unit of stock arrives through set_variant_stock(). New variants are
--      inserted at 0 and then brought up, so sum(inventory_movements.delta) =
--      stock_qty stays true for a variant created by the grid, not just for the
--      seeded ones.

-- ---------------------------------------------------------------------------
-- sku_code()
-- ---------------------------------------------------------------------------
-- 'Indigo' -> IND, 'Rust' -> RUS, 'One Size' -> OS. Matches the seeded
-- convention exactly (FFH-AWD-S-IND), because a grid that generated FFH-AWD-S-1
-- would produce a catalogue where half the SKUs look like a different shop's.
--
-- Non-alphanumerics are stripped before truncating: 'Red Check' -> RED, not
-- 'RE ' with the space eating a character.
create or replace function sku_code(p_text text, p_fallback text default 'X')
returns text
language sql
immutable
as $$
  select case
    when p_text is null or btrim(p_text) = '' then p_fallback
    when lower(btrim(p_text)) = 'one size'         then 'OS'
    else upper(substr(regexp_replace(btrim(p_text), '[^a-zA-Z0-9]', '', 'g'), 1, 3))
  end;
$$;

comment on function sku_code(text, text) is
  'Three-letter SKU segment: first 3 alphanumerics uppercased. One Size -> OS.';

-- ---------------------------------------------------------------------------
-- save_product_variants()
-- ---------------------------------------------------------------------------
-- p_cells is the whole grid as the form sees it:
--
--   [{"size":"S","color":"Indigo","stock":12,"price":null}, ...]
--
-- Anything not in the array is a blank cell, and a blank cell means that
-- combination is not stocked.
--
-- p_default_price is the product-level price the grid shows at the top and
-- inherits down; a cell's own "price" overrides it and is how a single colour
-- is priced differently without touching the others.
create or replace function save_product_variants(
  p_product_id    uuid,
  p_cells         jsonb,
  p_default_price integer,
  p_note          text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product   record;
  v_cell      jsonb;
  v_size      text;
  v_color     text;
  v_stock     integer;
  v_price     integer;
  v_variant   record;
  v_new_id    uuid;
  v_sku       text;
  v_attempt   integer;
  v_created   integer := 0;
  v_updated   integer := 0;
  v_retired   integer := 0;
  v_stocked   integer := 0;
  v_keep      uuid[] := '{}';
begin
  if not is_staff() then
    raise exception 'not_staff' using errcode = '42501';
  end if;

  if p_cells is null or jsonb_typeof(p_cells) <> 'array' then
    raise exception 'invalid_cells' using errcode = '22023';
  end if;

  if p_default_price is null or p_default_price < 0 then
    raise exception 'invalid_price' using errcode = '22023';
  end if;

  select id, sku_prefix, title into v_product
  from products where id = p_product_id;

  if not found then
    raise exception 'not_found' using errcode = '22023';
  end if;

  -- A product with cells to save but no SKU stem cannot generate SKUs, and
  -- inventing one from the title here would disagree with what the form showed.
  if v_product.sku_prefix is null
     and jsonb_array_length(p_cells) > 0 then
    raise exception 'missing_sku_prefix' using errcode = '22023';
  end if;

  for v_cell in select * from jsonb_array_elements(p_cells)
  loop
    v_size  := nullif(btrim(coalesce(v_cell->>'size',  '')), '');
    v_color := nullif(btrim(coalesce(v_cell->>'color', '')), '');

    -- jsonb ->> returns text; '' is a cleared box and must not become 0.
    if v_cell->>'stock' is null or btrim(v_cell->>'stock') = '' then
      continue;                       -- an empty cell is not a variant
    end if;

    v_stock := (v_cell->>'stock')::integer;

    if v_stock < 0 then
      raise exception 'invalid_quantity' using errcode = '22023';
    end if;

    v_price := coalesce(nullif(v_cell->>'price', '')::integer, p_default_price);

    if v_price < 0 then
      raise exception 'invalid_price' using errcode = '22023';
    end if;

    -- IS NOT DISTINCT FROM, not `=`: size and colour are both nullable and a
    -- one-size, no-colour variant has NULL in both. `=` would never match it and
    -- every save would try to insert a duplicate the unique constraint rejects.
    select id, stock_qty, price_kes into v_variant
    from product_variants
    where product_id = p_product_id
      and size  is not distinct from v_size
      and color is not distinct from v_color;

    if found then
      update product_variants
         set price_kes  = v_price,
             is_active  = true,
             updated_at = now()
       where id = v_variant.id;

      v_keep    := v_keep || v_variant.id;
      v_updated := v_updated + 1;

      if v_variant.stock_qty <> v_stock then
        perform set_variant_stock(
          v_variant.id, v_stock,
          'restock',
          coalesce(nullif(btrim(coalesce(p_note, '')), ''), 'grid save')
        );
        v_stocked := v_stocked + 1;
      end if;

    else
      -- SKU, with a suffix only when the natural three-letter code is taken.
      -- 'Indigo' and 'Indigo Blue' both want IND; the second becomes IND2 rather
      -- than failing the whole save on a collision the operator did not cause.
      v_sku := null;
      for v_attempt in 0..9 loop
        v_sku := v_product.sku_prefix
                 || '-' || sku_code(v_size,  'OS')
                 || '-' || sku_code(v_color, 'STD');
        if v_attempt > 0 then
          v_sku := v_sku || v_attempt::text;
        end if;

        exit when not exists (select 1 from product_variants where sku = v_sku);
        v_sku := null;
      end loop;

      if v_sku is null then
        raise exception 'sku_collision:%', v_product.sku_prefix using errcode = '22023';
      end if;

      -- Inserted at zero, then raised through set_variant_stock, so the opening
      -- stock of a grid-created variant is a ledger row like every other unit.
      insert into product_variants
        (product_id, sku, size, color, price_kes, stock_qty, is_active)
      values
        (p_product_id, v_sku, v_size, v_color, v_price, 0, true)
      returning id into v_new_id;

      v_keep    := v_keep || v_new_id;
      v_created := v_created + 1;

      if v_stock > 0 then
        perform set_variant_stock(
          v_new_id, v_stock, 'restock',
          coalesce(nullif(btrim(coalesce(p_note, '')), ''), 'grid: opening stock')
        );
        v_stocked := v_stocked + 1;
      end if;
    end if;
  end loop;

  -- Retire, never delete. A variant that was stocked and is now blank is hidden
  -- from the storefront and keeps its ledger.
  update product_variants
     set is_active  = false,
         updated_at = now()
   where product_id = p_product_id
     and is_active
     and not (id = any (v_keep));

  get diagnostics v_retired = row_count;

  return jsonb_build_object(
    'created',   v_created,
    'updated',   v_updated,
    'retired',   v_retired,
    'restocked', v_stocked
  );
end;
$$;

comment on function save_product_variants(uuid, jsonb, integer, text) is
  'Saves the whole variant grid in one transaction. Blank cells retire variants (is_active=false) rather than deleting them, preserving the stock ledger.';

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
-- authenticated only. Like the other staff functions, every call re-checks
-- is_staff() internally; the grant keeps the endpoint off the anonymous surface
-- where create_order already sits unlimited.
grant execute on function save_product_variants(uuid, jsonb, integer, text)
  to authenticated;
grant execute on function sku_code(text, text) to authenticated;