-- ============================================================================
-- 04 — order numbers
-- ============================================================================
-- Public identity for an order: "FFH-" + 10 Crockford base32 characters.
--
-- Crockford base32 is 0-9 and A-Z minus I, L, O and U (the characters people
-- misread as 1, 1, 0 and V), so the alphabet is exactly 32 symbols and the
-- space is 32^10 ~= 2^50.
--
-- It is RANDOM, not a sequence. FFH-001 leaked both order volume and ordering,
-- and it was guessable: with phone + order number as the lookup credential,
-- and Kenyan mobile numbers enumerable, a sequence means one valid phone
-- number is enough to walk the entire order book.
--
-- Entropy comes from gen_random_bytes(), not random(). Postgres' random() is
-- not cryptographically secure and is seeded per backend; it is the wrong tool
-- for a value an attacker is motivated to predict.

create or replace function set_order_number()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  -- Crockford base32: no I, L, O, U.
  alphabet  constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  candidate text;
  i         int;
begin
  -- Allow an explicit value (tests, imports); otherwise mint one.
  if new.order_number is not null and new.order_number <> '' then
    return new;
  end if;

  -- A collision is astronomically unlikely (2^50 space), but the check is
  -- cheap and makes the intent explicit. The unique index on order_number
  -- remains the real guard, including under concurrent inserts.
  loop
    candidate := 'FFH-';
    for i in 1..10 loop
      candidate := candidate || substr(
        alphabet,
        1 + (get_byte(gen_random_bytes(1), 0) % 32),
        1
      );
    end loop;
    exit when not exists (select 1 from orders where order_number = candidate);
  end loop;

  new.order_number := candidate;
  return new;
end;
$$;

create trigger orders_set_order_number
  before insert on orders
  for each row execute function set_order_number();

comment on function set_order_number() is
  'Mints an unguessable public order number (FFH- + 10 Crockford base32 chars). Random, never sequential.';