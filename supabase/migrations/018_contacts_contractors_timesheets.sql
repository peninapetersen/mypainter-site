-- Suppliers, contractors (subcontractors), timesheets on Jobs On

create table if not exists public.mp_suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  company_name text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  account_code text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mp_contractors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  company_name text not null default '',
  email text not null default '',
  phone text not null default '',
  trade text not null default '',
  hourly_rate numeric(10,2) not null default 0,
  day_rate numeric(10,2) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mp_crew_timesheets add column if not exists jobs_on_id uuid references public.mp_jobs_on(id) on delete set null;
alter table public.mp_crew_timesheets add column if not exists contractor_id uuid references public.mp_contractors(id) on delete set null;

create index if not exists idx_mp_suppliers_user on public.mp_suppliers(user_id);
create index if not exists idx_mp_contractors_user on public.mp_contractors(user_id);
create index if not exists idx_mp_timesheets_jobs_on on public.mp_crew_timesheets(jobs_on_id);

alter table public.mp_suppliers enable row level security;
alter table public.mp_contractors enable row level security;

drop policy if exists "mp_suppliers_owner" on public.mp_suppliers;
create policy "mp_suppliers_owner" on public.mp_suppliers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "mp_contractors_owner" on public.mp_contractors;
create policy "mp_contractors_owner" on public.mp_contractors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists mp_suppliers_updated_at on public.mp_suppliers;
create trigger mp_suppliers_updated_at before update on public.mp_suppliers
  for each row execute function mp_set_updated_at();

drop trigger if exists mp_contractors_updated_at on public.mp_contractors;
create trigger mp_contractors_updated_at before update on public.mp_contractors
  for each row execute function mp_set_updated_at();
