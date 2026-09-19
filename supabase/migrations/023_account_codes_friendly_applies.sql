-- Friendly pill names + workflow section tags on account codes

alter table public.mp_account_codes
  add column if not exists friendly_name text not null default '',
  add column if not exists applies_to text[] not null default '{}';

-- Income
update public.mp_account_codes set friendly_name = 'Painting', applies_to = array['products_services','quotes','invoices','tax_return'] where code = '2000';
update public.mp_account_codes set friendly_name = 'Consulting', applies_to = array['products_services','quotes','invoices','tax_return'] where code = '2010';
update public.mp_account_codes set friendly_name = 'Handyman', applies_to = array['products_services','quotes','invoices','tax_return'] where code = '2100';

-- Materials / COGS
update public.mp_account_codes set friendly_name = 'Materials', applies_to = array['expenses','suppliers','jobs_on_costs','tax_return'] where code = '3100';
update public.mp_account_codes set friendly_name = 'Prep & sundries', applies_to = array['expenses','suppliers','jobs_on_costs','tax_return'] where code = '3101';
update public.mp_account_codes set friendly_name = 'Small tools', applies_to = array['expenses','suppliers','jobs_on_costs','tax_return'] where code = '3102';

-- Motor vehicle
update public.mp_account_codes set friendly_name = 'Motor vehicle', applies_to = array['expenses','tax_return'] where code in ('4200','4201','4202');

-- Other expense
update public.mp_account_codes set friendly_name = 'Tools', applies_to = array['expenses','tax_return'] where code = '4300';
update public.mp_account_codes set friendly_name = 'Subcontractors', applies_to = array['expenses','suppliers','contractors','jobs_on_costs','tax_return'] where code = '5100';
update public.mp_account_codes set friendly_name = 'Insurance', applies_to = array['expenses','tax_return'] where code = '6100';
update public.mp_account_codes set friendly_name = 'Phone & internet', applies_to = array['expenses','tax_return'] where code = '6200';
update public.mp_account_codes set friendly_name = 'Accounting', applies_to = array['expenses','tax_return'] where code = '6300';
update public.mp_account_codes set friendly_name = 'Advertising', applies_to = array['expenses','tax_return'] where code = '6400';

-- Assets
update public.mp_account_codes set friendly_name = 'Vehicle asset', applies_to = array['expenses','tax_return'] where code = '7100';
update public.mp_account_codes set friendly_name = 'Tools asset', applies_to = array['expenses','tax_return'] where code = '7200';

-- Default friendly name where still empty
update public.mp_account_codes set friendly_name = name where friendly_name = '' or friendly_name is null;
