-- Repair: live DB skipped 015 / 019 / 026 work_settings columns.
-- Safe to re-run (IF NOT EXISTS).

alter table public.mp_work_settings add column if not exists quote_default_terms text not null default 'This quote is valid for the next 30 days, after which values may be subject to change.';
alter table public.mp_work_settings add column if not exists invoice_default_contract text not null default '';
alter table public.mp_work_settings add column if not exists document_phone text not null default '021 083 01415';
alter table public.mp_work_settings add column if not exists document_email text not null default 'mypaintermate@gmail.com';
alter table public.mp_work_settings add column if not exists document_tagline text not null default 'Painting & Handyman · Whangarei & Northland';

alter table public.mp_work_settings add column if not exists gst_rate numeric(6,4) not null default 0.15;
alter table public.mp_work_settings add column if not exists gst_default_on_quotes boolean not null default true;
alter table public.mp_work_settings add column if not exists gst_default_on_invoices boolean not null default true;
alter table public.mp_work_settings add column if not exists default_tax_mode text not null default 'exclusive';

alter table public.mp_work_settings add column if not exists contact_list_columns jsonb not null default '{}'::jsonb;

comment on column public.mp_work_settings.contact_list_columns is 'Visible columns per contacts menu list — customers, companies, suppliers, contractors';
