-- Saldo Claro finance foundation. Designed for Supabase Postgres.
-- This migration is intentionally NOT applied automatically.
-- Monetary values are stored as integer centavos to avoid floating-point errors.

create extension if not exists pgcrypto;

create type public.finance_account_type as enum ('checking', 'savings', 'cash', 'digital_wallet', 'investment', 'other');
create type public.finance_transaction_kind as enum ('income', 'expense', 'transfer', 'card');
create type public.finance_transaction_status as enum ('pending', 'paid', 'received', 'overdue', 'cancelled');

create table public.finance_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  has_seen_welcome boolean not null default false,
  demo_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  account_type public.finance_account_type not null,
  institution text,
  color varchar(16) not null default '#0B6B62',
  initial_balance_cents bigint not null default 0,
  include_in_total boolean not null default true,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.finance_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  kind public.finance_transaction_kind not null check (kind in ('income', 'expense')),
  color varchar(16) not null default '#0B6B62',
  icon varchar(64) not null default 'category',
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name, kind)
);

create table public.finance_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.finance_accounts(id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 100),
  brand varchar(32) not null,
  last_digits varchar(4),
  limit_cents bigint not null check (limit_cents >= 0),
  closing_day smallint not null check (closing_day between 1 and 31),
  due_day smallint not null check (due_day between 1 and 31),
  color varchar(16) not null default '#163C57',
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.finance_transaction_kind not null,
  status public.finance_transaction_status not null default 'pending',
  description text not null check (char_length(trim(description)) between 1 and 180),
  amount_cents bigint not null check (amount_cents > 0),
  transaction_date date not null,
  due_date date,
  account_id uuid references public.finance_accounts(id) on delete set null,
  destination_account_id uuid references public.finance_accounts(id) on delete set null,
  card_id uuid references public.finance_cards(id) on delete set null,
  category_id uuid references public.finance_categories(id) on delete set null,
  note text,
  installment_current smallint check (installment_current > 0),
  installment_total smallint check (installment_total > 0),
  recurring boolean not null default false,
  import_fingerprint varchar(128),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind <> 'transfer' or (account_id is not null and destination_account_id is not null and account_id <> destination_account_id)),
  check (installment_current is null or installment_total is null or installment_current <= installment_total)
);

create table public.finance_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.finance_categories(id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  amount_cents bigint not null check (amount_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);

create table public.finance_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  target_cents bigint not null check (target_cents > 0),
  saved_cents bigint not null default 0 check (saved_cents >= 0),
  target_date date,
  color varchar(16) not null default '#0B6B62',
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only import metadata and a content hash are retained. Store original OFX only in a private bucket
-- when the user explicitly chooses to retain it; otherwise delete it after processing.
create table public.finance_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type varchar(16) not null check (source_type in ('csv', 'ofx')),
  file_name text not null,
  content_sha256 varchar(64) not null,
  transaction_count integer not null default 0 check (transaction_count >= 0),
  storage_path text,
  created_at timestamptz not null default now(),
  unique (user_id, content_sha256)
);

create index finance_accounts_user_active_idx on public.finance_accounts (user_id, archived_at) where deleted_at is null;
create index finance_cards_user_active_idx on public.finance_cards (user_id, archived_at) where deleted_at is null;
create index finance_categories_user_kind_idx on public.finance_categories (user_id, kind) where deleted_at is null;
create index finance_transactions_user_date_idx on public.finance_transactions (user_id, transaction_date desc, id desc) where deleted_at is null;
create index finance_transactions_user_account_date_idx on public.finance_transactions (user_id, account_id, transaction_date desc) where deleted_at is null;
create index finance_transactions_user_card_date_idx on public.finance_transactions (user_id, card_id, transaction_date desc) where deleted_at is null;
create unique index finance_transactions_import_fingerprint_idx on public.finance_transactions (user_id, import_fingerprint) where import_fingerprint is not null and deleted_at is null;
create index finance_imports_user_created_idx on public.finance_imports (user_id, created_at desc);

create or replace function public.set_finance_updated_at() returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger finance_preferences_updated before update on public.finance_preferences for each row execute function public.set_finance_updated_at();
create trigger finance_accounts_updated before update on public.finance_accounts for each row execute function public.set_finance_updated_at();
create trigger finance_categories_updated before update on public.finance_categories for each row execute function public.set_finance_updated_at();
create trigger finance_cards_updated before update on public.finance_cards for each row execute function public.set_finance_updated_at();
create trigger finance_transactions_updated before update on public.finance_transactions for each row execute function public.set_finance_updated_at();
create trigger finance_budgets_updated before update on public.finance_budgets for each row execute function public.set_finance_updated_at();
create trigger finance_goals_updated before update on public.finance_goals for each row execute function public.set_finance_updated_at();

alter table public.finance_preferences enable row level security;
alter table public.finance_accounts enable row level security;
alter table public.finance_categories enable row level security;
alter table public.finance_cards enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.finance_budgets enable row level security;
alter table public.finance_goals enable row level security;
alter table public.finance_imports enable row level security;

-- Every finance query is constrained to the authenticated owner. Service-role jobs bypass RLS only on the server.
create policy "finance_preferences_owner" on public.finance_preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "finance_accounts_owner" on public.finance_accounts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "finance_categories_owner" on public.finance_categories for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "finance_cards_owner" on public.finance_cards for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "finance_transactions_owner" on public.finance_transactions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "finance_budgets_owner" on public.finance_budgets for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "finance_goals_owner" on public.finance_goals for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "finance_imports_owner" on public.finance_imports for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
