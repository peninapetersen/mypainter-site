-- Run this if approve works but Jobs On stays empty (creates mp_jobs_on + links)

create table if not exists public.mp_jobs_on (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references public.mp_jobs(id) on delete set null,
  quote_id uuid references public.mp_quotes(id) on delete set null,
  request_id uuid references public.mp_requests(id) on delete set null,
  client_id uuid references public.mp_clients(id) on delete set null,
  number text not null default '',
  title text not null default '',
  site_address text not null default '',
  line_items jsonb not null default '[]'::jsonb,
  notes text not null default '',
  status text not null default 'active',
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mp_jobs_on_quote on public.mp_jobs_on(quote_id);
create index if not exists idx_mp_jobs_on_lead on public.mp_jobs_on(lead_id);

alter table public.mp_jobs_on enable row level security;

drop policy if exists "mp_jobs_on_owner" on public.mp_jobs_on;
create policy "mp_jobs_on_owner" on public.mp_jobs_on
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.mp_pipeline_opportunities add column if not exists jobs_on_id uuid references public.mp_jobs_on(id) on delete set null;

drop trigger if exists mp_jobs_on_updated_at on public.mp_jobs_on;
create trigger mp_jobs_on_updated_at before update on public.mp_jobs_on
  for each row execute function mp_set_updated_at();
