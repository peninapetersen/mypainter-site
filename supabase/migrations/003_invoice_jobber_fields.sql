-- Jobber-style invoice fields + source links for quote/request conversions

alter table mp_invoices add column if not exists quote_id uuid references mp_quotes(id) on delete set null;
alter table mp_invoices add column if not exists request_id uuid references mp_requests(id) on delete set null;
alter table mp_invoices add column if not exists discount numeric(10,2) not null default 0;
alter table mp_invoices add column if not exists client_message text not null default '';
alter table mp_invoices add column if not exists contract text not null default 'Thank you for your business. Please contact us with any questions regarding this invoice.';
alter table mp_invoices add column if not exists internal_notes text not null default '';

create index if not exists idx_mp_invoices_quote on mp_invoices(quote_id);
create index if not exists idx_mp_invoices_request on mp_invoices(request_id);
