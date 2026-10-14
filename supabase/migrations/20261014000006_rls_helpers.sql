-- ============================================================================
-- 06 — rls helpers
-- ============================================================================
-- Two functions every policy and every write path depends on. Defined before
-- the policies that call them.

-- ---------------------------------------------------------------------------
-- is_staff()
-- ---------------------------------------------------------------------------
-- Membership in `staff` is the single definition of "works here". Middleware
-- may redirect /admin, but middleware is advisory: a forged request that skips
-- it still lands on RLS, and RLS asks this function, which reads the table.
--
-- security definer so it can read `staff` regardless of the caller's own
-- policies on that table — otherwise the check would recurse into itself.
create or replace function is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff where user_id = auth.uid()
  );
$$;

comment on function is_staff() is
  'True when auth.uid() has a row in staff. The single gate for every staff policy.';

-- ---------------------------------------------------------------------------
-- normalize_phone()
-- ---------------------------------------------------------------------------
-- One Kenyan phone number must be one row. Customers type 0712…, +254712…,
-- 254712… and 0712 345 678 interchangeably; without normalisation those are
-- four customers and the order lookup silently fails.
--
-- Returns E.164 (+254712345678), or NULL when the input is not a Kenyan
-- mobile number. NULL is deliberate: an unparseable phone must fail the
-- lookup, not match something.
--
-- Kenyan mobile prefixes are 07xx and 01xx (the 01 range is the newer
-- allocation and is in active use).
create or replace function normalize_phone(raw text)
returns text
language plpgsql
immutable
as $$
declare
  digits text;
begin
  if raw is null or btrim(raw) = '' then
    return null;
  end if;

  -- Strip everything that is not a digit: spaces, +, -, brackets.
  digits := regexp_replace(raw, '\D', '', 'g');

  if digits ~ '^0[17][0-9]{8}$' then
    -- 0712345678 -> 254712345678
    digits := '254' || substr(digits, 2);
  elsif digits ~ '^[17][0-9]{8}$' then
    -- 712345678 -> 254712345678
    digits := '254' || digits;
  elsif digits !~ '^254[17][0-9]{8}$' then
    -- Neither national (254…) nor a form we can promote to it. Refuse rather
    -- than guess — a wrong number must not silently become a valid identity.
    return null;
  end if;

  return '+' || digits;
end;
$$;

comment on function normalize_phone(text) is
  'Kenyan mobile number to E.164 (+2547XXXXXXXX / +2541XXXXXXXX). NULL when unparseable.';
