-- Work settings (Jobber-style) — one row per user

create table if not exists mp_work_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  quote_reminder_enabled boolean not null default false,
  quote_reminder_days integer not null default 3,
  arrival_window text not null default 'None',
  arrival_window_style text not null default 'after',
  visit_title_template text not null default '{{CLIENT_NAME}} - {{JOB_TITLE}}',
  invoice_subject_default text not null default 'For Services Rendered',
  invoice_use_job_title boolean not null default true,
  payment_terms_residential text not null default 'Due upon receipt',
  payment_terms_commercial text not null default 'Net 30',
  statement_sort_order text not null default 'newest_first',
  statement_disclaimer text not null default '',
  invoice_reminder_reassign boolean not null default false,
  invoice_reminder_assigned_to text not null default 'Richo Petersen',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_mp_work_settings_updated on mp_work_settings;
create trigger trg_mp_work_settings_updated before update on mp_work_settings
  for each row execute function mp_set_updated_at();

alter table mp_work_settings enable row level security;

create policy "mp_work_settings_owner" on mp_work_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
