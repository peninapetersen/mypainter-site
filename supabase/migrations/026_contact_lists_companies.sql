-- Company client records + contact list column preferences

alter table public.mp_clients add column if not exists client_type text not null default 'person';
alter table public.mp_clients drop constraint if exists mp_clients_client_type_check;
alter table public.mp_clients add constraint mp_clients_client_type_check
  check (client_type in ('person', 'company'));

alter table public.mp_work_settings add column if not exists contact_list_columns jsonb not null default '{}'::jsonb;

comment on column public.mp_clients.client_type is 'person = customer contact; company = org record linked from customers';
comment on column public.mp_work_settings.contact_list_columns is 'Visible columns per contacts menu list — customers, companies, suppliers, contractors';
