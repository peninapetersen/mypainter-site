-- Site address for measure-up / job visits (editable on job, shown on map)

alter table mp_jobs
  add column if not exists site_address text not null default '';
