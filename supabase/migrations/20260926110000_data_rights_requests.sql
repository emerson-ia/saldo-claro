-- Requests are created by the authenticated account and handled by the
-- controller outside the client. No administrative credential is exposed to
-- the application to delete users directly.
create table if not exists public.finance_data_rights_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('account_deletion')),
  status text not null default 'received' check (status in ('received', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_data_rights_requests_user_created_idx
  on public.finance_data_rights_requests (user_id, created_at desc);

alter table public.finance_data_rights_requests enable row level security;

create policy "finance_data_rights_requests_owner_read"
  on public.finance_data_rights_requests for select to authenticated
  using (user_id = auth.uid());

create policy "finance_data_rights_requests_owner_create"
  on public.finance_data_rights_requests for insert to authenticated
  with check (user_id = auth.uid());
