-- A user-owned buffer is explicit. Zero is the safe migration default; the app
-- never guesses a percentage of someone else's money.
alter table public.finance_preferences
  add column if not exists safety_buffer_cents bigint not null default 0
  check (safety_buffer_cents >= 0);
