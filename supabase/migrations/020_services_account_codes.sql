-- Tax / income account code on products & services catalogue

alter table public.mp_services add column if not exists account_code text not null default '2000';
