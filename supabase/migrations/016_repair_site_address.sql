-- Repair: site_address on leads (mp_jobs) — required for quote approval → Jobs On

alter table public.mp_jobs add column if not exists site_address text not null default '';
