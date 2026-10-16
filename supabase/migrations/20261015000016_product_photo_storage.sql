-- ============================================================================
-- 16 — product photo storage
-- ============================================================================
-- public/images/ is empty and nothing has ever been able to fill it: the seed
-- points at /images/*.jpg files that were never added, so every card has been
-- rendering its letter-tile fallback since the storefront was built. This is
-- the bucket that makes a product photographable.
--
-- One public bucket, four policies, and the staff gate reused rather than
-- reinvented. `is_staff()` is already the single definition of "may write the
-- catalogue" — products, product_variants and product_images all use it — and a
-- storage policy that decided staff membership any other way would be a second
-- answer to a question that already has one.
--
-- Public read is deliberate and matches product_images_public_read: a product
-- photo is shown to anonymous shoppers on the storefront, so it cannot be a
-- private object behind a signed URL. The bucket holds nothing but product
-- photos; nothing customer-identifying ever goes in it.

-- ---------------------------------------------------------------------------
-- bucket
-- ---------------------------------------------------------------------------
-- 5 MB and an image-only MIME allowlist. A phone photo of a dress is 2-4 MB, so
-- the limit is generous for the real case and still refuses a raw 40 MB file or
-- a mis-tapped video. allowed_mime_types is enforced by the storage service on
-- upload, before the bytes are stored — not checked afterwards by the app.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- policies
-- ---------------------------------------------------------------------------
-- storage.objects already has RLS enabled by the storage extension; these are
-- the only policies on it in this project, and every one is scoped to this
-- bucket by name. A policy that forgot `bucket_id = 'product-images'` would
-- grant catalogue staff write access to every other bucket on the project the
-- day one is added.

drop policy if exists product_images_storage_public_read on storage.objects;
create policy product_images_storage_public_read on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists product_images_storage_staff_insert on storage.objects;
create policy product_images_storage_staff_insert on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'product-images' and is_staff());

-- Update and delete are separate policies rather than one ALL policy: a typo in
-- an ALL policy's WITH CHECK silently widens writes, and these two are the only
-- ones that can destroy something a customer is looking at.
drop policy if exists product_images_storage_staff_update on storage.objects;
create policy product_images_storage_staff_update on storage.objects
  for update
  to authenticated
  using (bucket_id = 'product-images' and is_staff())
  with check (bucket_id = 'product-images' and is_staff());

drop policy if exists product_images_storage_staff_delete on storage.objects;
create policy product_images_storage_staff_delete on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-images' and is_staff());

-- ---------------------------------------------------------------------------
-- product_images.url becomes a full URL
-- ---------------------------------------------------------------------------
-- The column was written for /images/*.jpg relative paths. It now also holds
-- absolute https://<project>.supabase.co/storage/v1/object/public/... URLs.
-- Nothing about the column changes — it was always `text` and a URL is text —
-- but catalogue.ts's resolveImage() distinguishes the two, and that is recorded
-- in the app rather than here.
comment on column product_images.url is
  'Absolute public URL (Storage) or a /-relative path for files shipped in public/. Both are supported.';