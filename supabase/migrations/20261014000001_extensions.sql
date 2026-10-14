-- ============================================================================
-- 01 — extensions
-- ============================================================================
-- pgcrypto supplies gen_random_bytes(), which set_order_number() uses to make
-- public order numbers unguessable. Postgres' own random() is NOT
-- cryptographically secure, and the order number is the only secret standing
-- between an enumerable Kenyan phone number and someone else's order.
--
-- Supabase installs extensions into the `extensions` schema by convention.

create extension if not exists pgcrypto with schema extensions;