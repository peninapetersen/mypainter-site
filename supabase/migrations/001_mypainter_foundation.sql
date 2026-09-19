-- MyPainter business tables (mp_* prefix) — My Sites Supabase project
-- Run in: https://supabase.com/dashboard/project/jkampxliebnzsevvmqre/sql

create or replace function mp_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Clients
create table if not exists mp_clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  tags text[] not null default '{}',
  status text not null default 'lead',
  last_activity_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Requests
create table if not exists mp_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references mp_clients(id) on delete set null,
  title text not null default '',
  requested_on date,
  service_details text not null default '',
  images jsonb not null default '[]'::jsonb,
  assessment_at timestamptz,
  line_items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null default 0,
  status text not null default 'draft',
  internal_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Quote sequence (MP-131+)
create table if not exists mp_quote_seq (
  user_id uuid primary key references auth.users(id) on delete cascade,
  next_num integer not null default 131
);

-- Quotes
create table if not exists mp_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references mp_clients(id) on delete set null,
  request_id uuid references mp_requests(id) on delete set null,
  number text not null default '',
  title text not null default '',
  quote_date date,
  valid_until date,
  line_items jsonb not null default '[]'::jsonb,
  discount numeric(10,2) not null default 0,
  subtotal numeric(10,2) not null default 0,
  gst numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  terms text not null default 'This quote is valid for the next 30 days, after which values may be subject to change.',
  status text not null default 'draft',
  internal_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, number)
);

-- Jobs
create table if not exists mp_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references mp_clients(id) on delete set null,
  quote_id uuid references mp_quotes(id) on delete set null,
  number text not null default '',
  title text not null default '',
  visits jsonb not null default '[]'::jsonb,
  billing_flags jsonb not null default '{}'::jsonb,
  line_items jsonb not null default '[]'::jsonb,
  subtotal_cost numeric(10,2) not null default 0,
  subtotal_price numeric(10,2) not null default 0,
  status text not null default 'scheduled',
  notes text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Invoices
create table if not exists mp_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references mp_clients(id) on delete set null,
  job_id uuid references mp_jobs(id) on delete set null,
  number text not null default '',
  subject text not null default 'For Services Rendered',
  issued_date date,
  payment_terms text not null default '',
  line_items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null default 0,
  gst numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  balance numeric(10,2) not null default 0,
  paid_at timestamptz,
  status text not null default 'draft',
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Expenses
create table if not exists mp_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references mp_jobs(id) on delete set null,
  amount numeric(10,2) not null default 0,
  gst_inclusive boolean not null default true,
  category text not null default 'COGS_Materials',
  description text not null default '',
  expense_date date,
  receipt_path text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Timesheets
create table if not exists mp_crew_timesheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  crew_member text not null default '',
  job_id uuid references mp_jobs(id) on delete set null,
  check_in_time timestamptz,
  check_out_time timestamptz,
  duration_seconds integer,
  geo jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Revenue goals
create table if not exists mp_revenue_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  target_amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pipeline
create table if not exists mp_pipeline_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references mp_clients(id) on delete set null,
  title text not null default '',
  stage text not null default 'New Requests',
  deal_value numeric(10,2) not null default 0,
  assigned_to text not null default '',
  address text not null default '',
  outcome text,
  outcome_reason text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Gallery (Phase 2 migration from D1)
create table if not exists mp_gallery_albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  title text not null,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create table if not exists mp_gallery_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  album_id uuid not null references mp_gallery_albums(id) on delete cascade,
  storage_path text not null,
  caption text not null default '',
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at triggers
do $$ declare t text; begin
  foreach t in array array[
    'mp_clients','mp_requests','mp_quotes','mp_jobs','mp_invoices',
    'mp_expenses','mp_crew_timesheets','mp_revenue_goals','mp_pipeline_opportunities',
    'mp_gallery_albums','mp_gallery_photos'
  ] loop
    execute format('drop trigger if exists trg_%s_updated on %s', t, t);
    execute format(
      'create trigger trg_%s_updated before update on %s for each row execute function mp_set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- RLS
alter table mp_clients enable row level security;
alter table mp_requests enable row level security;
alter table mp_quotes enable row level security;
alter table mp_quote_seq enable row level security;
alter table mp_jobs enable row level security;
alter table mp_invoices enable row level security;
alter table mp_expenses enable row level security;
alter table mp_crew_timesheets enable row level security;
alter table mp_revenue_goals enable row level security;
alter table mp_pipeline_opportunities enable row level security;
alter table mp_gallery_albums enable row level security;
alter table mp_gallery_photos enable row level security;

-- Owner policies (all operations)
create policy "mp_clients_owner" on mp_clients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mp_requests_owner" on mp_requests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mp_quotes_owner" on mp_quotes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mp_quote_seq_owner" on mp_quote_seq for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mp_jobs_owner" on mp_jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mp_invoices_owner" on mp_invoices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mp_expenses_owner" on mp_expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mp_crew_timesheets_owner" on mp_crew_timesheets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mp_revenue_goals_owner" on mp_revenue_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mp_pipeline_owner" on mp_pipeline_opportunities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mp_gallery_albums_owner" on mp_gallery_albums for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mp_gallery_photos_owner" on mp_gallery_photos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public read for published gallery
create policy "mp_gallery_albums_public_read" on mp_gallery_albums for select using (published = true);
create policy "mp_gallery_photos_public_read" on mp_gallery_photos for select using (
  exists (
    select 1 from mp_gallery_albums a
    where a.id = album_id and a.published = true
  )
);

create index if not exists idx_mp_clients_user on mp_clients(user_id);
create index if not exists idx_mp_quotes_user on mp_quotes(user_id);
create index if not exists idx_mp_jobs_user on mp_jobs(user_id);
create index if not exists idx_mp_gallery_photos_album on mp_gallery_photos(album_id, sort_order);
