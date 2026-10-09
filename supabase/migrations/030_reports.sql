-- 030: Reports (assessments Richo sends to customers). No prices. Safe to re-run.

-- Report numbers: R-1, R-2 ...
create table if not exists public.mp_report_seq (
  user_id uuid primary key references auth.users(id) on delete cascade,
  next_num integer not null default 1
);

create table if not exists public.mp_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.mp_clients(id) on delete set null,
  quote_id uuid references public.mp_quotes(id) on delete set null,
  number text not null default '',
  title text not null default '',
  report_date date,
  site_address text not null default '',
  summary text not null default '',
  -- [{ "id": "...", "area": "North wall", "finding": "...", "recommended": "...", "photos": ["<storage path>", ...] }]
  areas jsonb not null default '[]'::jsonb,
  recommendations text not null default '',
  status text not null default 'draft',
  view_token text unique,
  sent_at timestamptz,
  internal_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, number)
);

alter table public.mp_report_seq enable row level security;
alter table public.mp_reports enable row level security;

drop policy if exists "mp_report_seq_owner" on public.mp_report_seq;
create policy "mp_report_seq_owner" on public.mp_report_seq for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "mp_reports_owner" on public.mp_reports;
create policy "mp_reports_owner" on public.mp_reports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Private bucket for report photos (customers see them only through the report link, which signs them)
insert into storage.buckets (id, name, public) values ('mypainter-reports', 'mypainter-reports', false)
on conflict (id) do nothing;

drop policy if exists "mypainter_reports_owner_all" on storage.objects;
create policy "mypainter_reports_owner_all" on storage.objects for all to authenticated
  using (bucket_id = 'mypainter-reports' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'mypainter-reports' and (storage.foldername(name))[1] = auth.uid()::text);

notify pgrst, 'reload schema';

select
  to_regclass('public.mp_reports') is not null as reports_table,
  to_regclass('public.mp_report_seq') is not null as seq_table,
  exists (select 1 from storage.buckets where id = 'mypainter-reports') as photo_bucket;
