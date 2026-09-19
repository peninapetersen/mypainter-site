-- Schedule: personal events + tasks (job visits + request assessments stay on existing tables)

create table if not exists mp_schedule_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('personal', 'task')),
  title text not null default '',
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  assigned_to text not null default '',
  client_id uuid references mp_clients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mp_schedule_events_user_starts
  on mp_schedule_events (user_id, starts_at);

drop trigger if exists trg_mp_schedule_events_updated on mp_schedule_events;
create trigger trg_mp_schedule_events_updated before update on mp_schedule_events
  for each row execute function mp_set_updated_at();

alter table mp_schedule_events enable row level security;

create policy "mp_schedule_events_owner" on mp_schedule_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
