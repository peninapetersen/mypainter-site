-- On-site checklists attached to jobs (measure-up, prep, etc.)

alter table mp_jobs
  add column if not exists checklists jsonb not null default '[]'::jsonb;
