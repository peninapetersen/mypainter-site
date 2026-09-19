-- Link product/service categories to default income tax codes

alter table public.mp_service_categories
  add column if not exists default_account_code text not null default '2000';

update public.mp_service_categories set default_account_code = '2000' where slug = 'painting';
update public.mp_service_categories set default_account_code = '2100' where slug = 'handyman';
update public.mp_service_categories set default_account_code = '2100' where slug = 'insurance';
update public.mp_service_categories set default_account_code = '2000' where slug = 'prep';
update public.mp_service_categories set default_account_code = '2010' where slug = 'consulting';
