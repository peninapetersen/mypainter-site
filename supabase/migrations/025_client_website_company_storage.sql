-- Customer website, CRM company link, gallery folders for contacts/crew/jobs/suppliers

alter table public.mp_clients add column if not exists website text not null default '';
alter table public.mp_clients add column if not exists company_client_id uuid references public.mp_clients(id) on delete set null;

comment on column public.mp_clients.website is 'Company or personal website URL';
comment on column public.mp_clients.company_client_id is 'Links person to company client record (CRM style)';

-- Gallery uploads beyond request-images (migration 008)
drop policy if exists "mp_gallery_app_insert" on storage.objects;
create policy "mp_gallery_app_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'mypainter-gallery'
    and (storage.foldername(name))[1] in ('contacts', 'contractors', 'jobs-on', 'supplier-logos')
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "mp_gallery_app_select" on storage.objects;
create policy "mp_gallery_app_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'mypainter-gallery'
    and (storage.foldername(name))[1] in ('contacts', 'contractors', 'jobs-on', 'supplier-logos', 'request-images')
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "mp_gallery_app_delete" on storage.objects;
create policy "mp_gallery_app_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'mypainter-gallery'
    and (storage.foldername(name))[1] in ('contacts', 'contractors', 'jobs-on', 'supplier-logos')
    and (storage.foldername(name))[2] = auth.uid()::text
  );
