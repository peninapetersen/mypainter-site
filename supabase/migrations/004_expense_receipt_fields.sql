-- Jobber-style expense fields + AI receipt extraction storage (tax-time ready)

alter table mp_expenses add column if not exists item_name text not null default '';
alter table mp_expenses add column if not exists merchant text not null default '';
alter table mp_expenses add column if not exists gst_amount numeric(10,2) not null default 0;
alter table mp_expenses add column if not exists accounting_code text not null default '';
alter table mp_expenses add column if not exists reimburse_to text not null default 'Not reimbursable';
alter table mp_expenses add column if not exists ai_extracted jsonb not null default '{}'::jsonb;

create index if not exists idx_mp_expenses_date on mp_expenses(user_id, expense_date desc);
