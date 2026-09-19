-- Pipeline Kanban: link cards to entities + testimonial tracking

alter table mp_pipeline_opportunities
  add column if not exists request_id uuid references mp_requests(id) on delete set null,
  add column if not exists quote_id uuid references mp_quotes(id) on delete set null,
  add column if not exists job_id uuid references mp_jobs(id) on delete set null,
  add column if not exists invoice_id uuid references mp_invoices(id) on delete set null,
  add column if not exists testimonial_requested boolean not null default false,
  add column if not exists testimonial_received boolean not null default false;

-- Normalise legacy stage names to new Kanban columns
update mp_pipeline_opportunities set stage = 'job' where stage in ('New Requests', 'Qualified', 'Assessment completed', 'job');
update mp_pipeline_opportunities set stage = 'quote' where stage in ('Quote sent', 'Follow up', 'quote');
update mp_pipeline_opportunities set stage = 'invoiced' where stage = 'invoiced';
update mp_pipeline_opportunities set stage = 'paid' where stage = 'paid';
update mp_pipeline_opportunities set stage = 'testimonial' where stage = 'testimonial';

alter table mp_pipeline_opportunities alter column stage set default 'job';

create index if not exists idx_mp_pipeline_stage on mp_pipeline_opportunities (user_id, stage, sort_order);
create index if not exists idx_mp_pipeline_job on mp_pipeline_opportunities (job_id) where job_id is not null;
create index if not exists idx_mp_pipeline_quote on mp_pipeline_opportunities (quote_id) where quote_id is not null;
create index if not exists idx_mp_pipeline_invoice on mp_pipeline_opportunities (invoice_id) where invoice_id is not null;
