-- Request image + receipt storage (Supabase Storage)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'mypainter-gallery',
    'mypainter-gallery',
    false,
    10485760,
    array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'mypainter-receipts',
    'mypainter-receipts',
    false,
    10485760,
    array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  )
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Request images: request-images/{user_id}/{folder}/{file}
drop policy if exists "mp_request_images_insert" on storage.objects;
create policy "mp_request_images_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'mypainter-gallery'
    and (storage.foldername(name))[1] = 'request-images'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "mp_request_images_select" on storage.objects;
create policy "mp_request_images_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'mypainter-gallery'
    and (storage.foldername(name))[1] = 'request-images'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "mp_request_images_delete" on storage.objects;
create policy "mp_request_images_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'mypainter-gallery'
    and (storage.foldername(name))[1] = 'request-images'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Receipts: {user_id}/{expense_id}/{file}
drop policy if exists "mp_receipts_insert" on storage.objects;
create policy "mp_receipts_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'mypainter-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "mp_receipts_select" on storage.objects;
create policy "mp_receipts_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'mypainter-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "mp_receipts_delete" on storage.objects;
create policy "mp_receipts_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'mypainter-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
