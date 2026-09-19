-- Customer headshots, job site photos, supplier logos

alter table public.mp_clients add column if not exists photo_path text not null default '';
alter table public.mp_contractors add column if not exists photo_path text not null default '';
alter table public.mp_jobs_on add column if not exists images jsonb not null default '[]'::jsonb;
alter table public.mp_suppliers add column if not exists website text not null default '';
alter table public.mp_suppliers add column if not exists logo_path text not null default '';

comment on column public.mp_clients.photo_path is 'Supabase storage path — mypainter-gallery/contacts/…';
comment on column public.mp_jobs_on.images is '[{ path, caption }] — bedroom pics, site photos';
comment on column public.mp_suppliers.logo_path is 'Fetched or uploaded logo — mypainter-gallery/supplier-logos/…';
