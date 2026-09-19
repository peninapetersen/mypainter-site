-- Expanded suppliers, GST settings, NZ painter account codes (Xero-style)

-- Supplier detail fields (Tradify-style)
alter table public.mp_suppliers add column if not exists mobile text not null default '';
alter table public.mp_suppliers add column if not exists fax text not null default '';
alter table public.mp_suppliers add column if not exists physical_street_1 text not null default '';
alter table public.mp_suppliers add column if not exists physical_street_2 text not null default '';
alter table public.mp_suppliers add column if not exists physical_city text not null default '';
alter table public.mp_suppliers add column if not exists physical_region text not null default '';
alter table public.mp_suppliers add column if not exists physical_postal_code text not null default '';
alter table public.mp_suppliers add column if not exists physical_country text not null default 'New Zealand';
alter table public.mp_suppliers add column if not exists postal_street_1 text not null default '';
alter table public.mp_suppliers add column if not exists postal_street_2 text not null default '';
alter table public.mp_suppliers add column if not exists postal_city text not null default '';
alter table public.mp_suppliers add column if not exists postal_region text not null default '';
alter table public.mp_suppliers add column if not exists postal_postal_code text not null default '';
alter table public.mp_suppliers add column if not exists postal_country text not null default 'New Zealand';
alter table public.mp_suppliers add column if not exists default_due_days integer not null default 30;
alter table public.mp_suppliers add column if not exists tax_mode text not null default 'exclusive';
alter table public.mp_suppliers add column if not exists default_account_code text not null default '3100';
alter table public.mp_suppliers add column if not exists gst_number text not null default '';

-- GST / tax defaults in work settings
alter table public.mp_work_settings add column if not exists gst_rate numeric(6,4) not null default 0.15;
alter table public.mp_work_settings add column if not exists gst_default_on_quotes boolean not null default true;
alter table public.mp_work_settings add column if not exists gst_default_on_invoices boolean not null default true;
alter table public.mp_work_settings add column if not exists default_tax_mode text not null default 'exclusive';

-- Chart of accounts — simple codes for NZ painter / tax time
create table if not exists public.mp_account_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  name text not null default '',
  account_type text not null default 'expense',
  gst_type text not null default 'gst_on_expenses',
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, code)
);

create index if not exists idx_mp_account_codes_user on public.mp_account_codes(user_id, sort_order);

alter table public.mp_account_codes enable row level security;

drop policy if exists "mp_account_codes_owner" on public.mp_account_codes;
create policy "mp_account_codes_owner" on public.mp_account_codes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists mp_account_codes_updated_at on public.mp_account_codes;
create trigger mp_account_codes_updated_at before update on public.mp_account_codes
  for each row execute function mp_set_updated_at();
