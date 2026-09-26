-- Monthly recurrence rules. Transactions remain separate accounting records;
-- rules only create the next occurrences and never alter historic entries.
create table public.finance_recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.finance_transaction_kind not null check (kind in ('income', 'expense', 'card')),
  description text not null check (char_length(trim(description)) between 1 and 180),
  amount_cents bigint not null check (amount_cents > 0),
  start_date date not null,
  day_of_month smallint not null check (day_of_month between 1 and 31),
  account_id uuid references public.finance_accounts(id) on delete set null,
  card_id uuid references public.finance_cards(id) on delete set null,
  category_id uuid references public.finance_categories(id) on delete set null,
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'card' and card_id is not null and account_id is null) or (kind in ('income', 'expense') and account_id is not null and card_id is null))
);

alter table public.finance_transactions
  add column if not exists recurrence_id uuid references public.finance_recurring_rules(id) on delete set null;

create index finance_recurring_rules_user_active_idx
  on public.finance_recurring_rules (user_id, active, start_date);
create unique index finance_transactions_recurrence_occurrence_idx
  on public.finance_transactions (recurrence_id, transaction_date)
  where recurrence_id is not null and deleted_at is null;

create trigger finance_recurring_rules_updated
  before update on public.finance_recurring_rules
  for each row execute function public.set_finance_updated_at();

alter table public.finance_recurring_rules enable row level security;
create policy "finance_recurring_rules_owner"
  on public.finance_recurring_rules for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
