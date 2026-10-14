-- ============================================================================
-- 10 — scheduled maintenance
-- ============================================================================
-- Everything before this migration defines *what* happens; this one defines
-- *when*. Two jobs run on a clock rather than on a request:
--
--   expire_stale_reservations()  releases stock held by orders that were never
--                                confirmed. Without it an abandoned checkout
--                                holds its units forever: available_qty stays
--                                reduced and a dress nobody bought becomes
--                                unsellable.
--
--   purge_lookup_attempts()      keeps the order-lookup rate-limit table
--                                bounded. The limiter only ever looks back 15
--                                minutes (08), so older rows are dead weight
--                                that would otherwise grow without limit.
--
-- Neither is a client action. expire_stale_reservations() is revoked from
-- anon/authenticated in 08, purge_lookup_attempts() below; only the scheduler
-- calls them.

-- pg_cron ships preloaded in the Supabase Postgres image and is available on
-- hosted projects, so the same mechanism serves local dev and production --
-- no HTTP endpoint and no shared secret to leak. It installs into pg_catalog
-- (it is not relocatable), hence no `with schema`.
create extension if not exists pg_cron;

-- ---------------------------------------------------------------------------
-- purge_lookup_attempts()
-- ---------------------------------------------------------------------------
-- security definer for the same reason the others are: lookup_attempts has
-- RLS enabled with a staff-only policy (07), so the table owner is the only
-- role that should be deleting from it in bulk.
create or replace function purge_lookup_attempts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  delete from lookup_attempts where attempted_at < now() - interval '24 hours';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function purge_lookup_attempts() is
  'Deletes rate-limit rows older than 24h. Returns the number removed.';

revoke execute on function purge_lookup_attempts() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- schedules
-- ---------------------------------------------------------------------------
-- The named form of cron.schedule() upserts on job name, so replaying this
-- migration updates each job in place instead of stacking duplicates.
--
-- The reservation window is 48h (08) and the sweep is idempotent, so every
-- 15 minutes is far more often than needed and still trivial in cost.
select cron.schedule(
  'expire-stale-reservations',
  '*/15 * * * *',
  $$select public.expire_stale_reservations();$$
);

-- 03:17 UTC — off the hour, and hours before any Nairobi business day starts.
select cron.schedule(
  'purge-lookup-attempts',
  '17 3 * * *',
  $$select public.purge_lookup_attempts();$$
);