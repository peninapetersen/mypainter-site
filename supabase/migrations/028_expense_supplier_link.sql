-- Link expenses to supplier records (paint shops, hire, materials)

alter table public.mp_expenses add column if not exists supplier_id uuid references public.mp_suppliers(id) on delete set null;

create index if not exists idx_mp_expenses_supplier on public.mp_expenses(supplier_id);

comment on column public.mp_expenses.supplier_id is 'Supplier paid — fills merchant + default expense code from mp_suppliers';
