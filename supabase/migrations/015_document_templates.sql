-- Document template defaults (quote / invoice PDFs)

alter table mp_work_settings add column if not exists quote_default_terms text not null default 'This quote is valid for the next 30 days, after which values may be subject to change.';
alter table mp_work_settings add column if not exists invoice_default_contract text not null default '';
alter table mp_work_settings add column if not exists document_phone text not null default '021 083 01415';
alter table mp_work_settings add column if not exists document_email text not null default 'mypaintermate@gmail.com';
alter table mp_work_settings add column if not exists document_tagline text not null default 'Painting & Handyman · Whangarei & Northland';
