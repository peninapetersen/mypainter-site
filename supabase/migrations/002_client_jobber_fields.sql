-- Jobber-style client fields — run in Supabase SQL editor (jkampxliebnzsevvmqre)

alter table mp_clients add column if not exists title text not null default '';
alter table mp_clients add column if not exists first_name text not null default '';
alter table mp_clients add column if not exists last_name text not null default '';
alter table mp_clients add column if not exists company_name text not null default '';
alter table mp_clients add column if not exists lead_source text not null default '';
alter table mp_clients add column if not exists communication_settings jsonb not null default '{"email":true,"sms":true}'::jsonb;
alter table mp_clients add column if not exists custom_fields jsonb not null default '[]'::jsonb;
alter table mp_clients add column if not exists billing_same_as_property boolean not null default true;

create table if not exists mp_client_properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references mp_clients(id) on delete cascade,
  street_1 text not null default '',
  street_2 text not null default '',
  city text not null default '',
  region text not null default '',
  postal_code text not null default '',
  country text not null default 'New Zealand',
  tax_rate text not null default '',
  is_primary boolean not null default false,
  is_billing boolean not null default false,
  custom_fields jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mp_client_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references mp_clients(id) on delete cascade,
  property_id uuid references mp_client_properties(id) on delete cascade,
  title text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  email text not null default '',
  notes text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_mp_client_properties_updated on mp_client_properties;
create trigger trg_mp_client_properties_updated before update on mp_client_properties
  for each row execute function mp_set_updated_at();

drop trigger if exists trg_mp_client_contacts_updated on mp_client_contacts;
create trigger trg_mp_client_contacts_updated before update on mp_client_contacts
  for each row execute function mp_set_updated_at();

alter table mp_client_properties enable row level security;
alter table mp_client_contacts enable row level security;

create policy "mp_client_properties_owner" on mp_client_properties
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "mp_client_contacts_owner" on mp_client_contacts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_mp_client_properties_client on mp_client_properties(client_id, sort_order);
create index if not exists idx_mp_client_contacts_client on mp_client_contacts(client_id, sort_order);
