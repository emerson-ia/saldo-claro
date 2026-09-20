-- Saldo Claro PRO billing foundation.
-- All payment-provider writes are performed only by trusted Edge Functions
-- using the service role; clients can only read their own subscription.

create table public.finance_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'mercado_pago' check (provider in ('mercado_pago')),
  provider_subscription_id text not null,
  plan_code text not null check (plan_code in ('pro_monthly', 'pro_annual')),
  status text not null default 'pending' check (status in (
    'pending', 'trialing', 'active', 'paused', 'past_due', 'cancelled', 'expired'
  )),
  amount_cents integer not null check (amount_cents > 0),
  currency char(3) not null default 'BRL' check (currency = upper(currency)),
  billing_interval text not null check (billing_interval in ('month', 'year')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_id),
  check (current_period_end is null or current_period_start is null or current_period_end >= current_period_start)
);

-- A provider notification can be retried at any time. provider_event_id is the
-- idempotency key used by the webhook before changing subscription access.
create table public.finance_billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.finance_subscriptions(id) on delete set null,
  provider text not null default 'mercado_pago' check (provider in ('mercado_pago')),
  provider_event_id text not null,
  event_type text not null check (char_length(trim(event_type)) between 1 and 120),
  status text not null default 'received' check (status in ('received', 'processed', 'ignored', 'failed')),
  occurred_at timestamptz,
  processed_at timestamptz,
  -- Keep only minimal, redacted provider metadata; never store card, token, or payer PII.
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index finance_subscriptions_user_status_idx
  on public.finance_subscriptions (user_id, status, updated_at desc);
create index finance_billing_events_subscription_created_idx
  on public.finance_billing_events (subscription_id, created_at desc);

create trigger finance_subscriptions_updated
  before update on public.finance_subscriptions
  for each row execute function public.set_finance_updated_at();

alter table public.finance_subscriptions enable row level security;
alter table public.finance_billing_events enable row level security;

-- No INSERT, UPDATE, or DELETE policies are intentionally defined: browser
-- clients cannot grant themselves PRO access or forge billing events.
create policy "finance_subscriptions_owner_read" on public.finance_subscriptions
  for select to authenticated using (user_id = auth.uid());
