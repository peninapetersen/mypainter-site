-- Workflow FK links: request→job, expenses→quote/invoice

alter table mp_jobs
  add column if not exists request_id uuid references mp_requests(id) on delete set null;

alter table mp_expenses
  add column if not exists quote_id uuid references mp_quotes(id) on delete set null;

alter table mp_expenses
  add column if not exists invoice_id uuid references mp_invoices(id) on delete set null;

create index if not exists idx_mp_jobs_request on mp_jobs(request_id);
create index if not exists idx_mp_expenses_quote on mp_expenses(quote_id);
create index if not exists idx_mp_expenses_invoice on mp_expenses(invoice_id);
