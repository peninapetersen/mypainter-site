-- Leads / Jobs On / customer quote approval / testimonials pipeline

-- Rename pipeline stage job → lead (measure-ups before quote approval)
update public.mp_pipeline_opportunities set stage = 'lead' where stage = 'job';

-- Quote: customer approval link
alter table public.mp_quotes add column if not exists approval_token text unique;
alter table public.mp_quotes add column if not exists sent_at timestamptz;
alter table public.mp_quotes add column if not exists approved_at timestamptz;

-- Approved work in progress (after customer clicks Approve on quote)
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

-- Invoice: link to Jobs On + testimonial request link
alter table public.mp_invoices add column if not exists jobs_on_id uuid references public.mp_jobs_on(id) on delete set null;
alter table public.mp_invoices add column if not exists testimonial_token text unique;
alter table public.mp_invoices add column if not exists sent_at timestamptz;

-- Expenses tie to Jobs On as well as lead (mp_jobs)
alter table public.mp_expenses add column if not exists jobs_on_id uuid references public.mp_jobs_on(id) on delete set null;

-- Pipeline cards link to Jobs On
alter table public.mp_pipeline_opportunities add column if not exists jobs_on_id uuid references public.mp_jobs_on(id) on delete set null;

-- Customer testimonials
create table if not exists public.mp_testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.mp_clients(id) on delete set null,
  lead_id uuid references public.mp_jobs(id) on delete set null,
  quote_id uuid references public.mp_quotes(id) on delete set null,
  jobs_on_id uuid references public.mp_jobs_on(id) on delete set null,
  invoice_id uuid references public.mp_invoices(id) on delete set null,
  customer_name text not null default '',
  rating integer not null default 5 check (rating >= 1 and rating <= 5),
  review_text text not null default '',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mp_testimonials_invoice on public.mp_testimonials(invoice_id);

-- RLS
alter table public.mp_jobs_on enable row level security;
alter table public.mp_testimonials enable row level security;

drop policy if exists "mp_jobs_on_owner" on public.mp_jobs_on;
create policy "mp_jobs_on_owner" on public.mp_jobs_on
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "mp_testimonials_owner" on public.mp_testimonials;
create policy "mp_testimonials_owner" on public.mp_testimonials
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public insert testimonial via service role only (Pages Function)
drop policy if exists "mp_testimonials_public_insert" on public.mp_testimonials;
-- no anon insert — handled server-side

drop trigger if exists mp_jobs_on_updated_at on public.mp_jobs_on;
create trigger mp_jobs_on_updated_at before update on public.mp_jobs_on
  for each row execute function mp_set_updated_at();

drop trigger if exists mp_testimonials_updated_at on public.mp_testimonials;
create trigger mp_testimonials_updated_at before update on public.mp_testimonials
  for each row execute function mp_set_updated_at();
