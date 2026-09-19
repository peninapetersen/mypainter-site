-- Product / service categories — toggle active, filter catalogue & website

create table if not exists public.mp_service_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  name text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists idx_mp_service_categories_user on public.mp_service_categories(user_id, sort_order);

alter table public.mp_service_categories enable row level security;

drop policy if exists "mp_service_categories_owner" on public.mp_service_categories;
create policy "mp_service_categories_owner" on public.mp_service_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists mp_service_categories_updated_at on public.mp_service_categories;
create trigger mp_service_categories_updated_at before update on public.mp_service_categories
  for each row execute function mp_set_updated_at();

-- Seed default categories for each app user (matches existing mp_services slugs)
insert into public.mp_service_categories (user_id, slug, name, sort_order, active)
select u.id, v.slug, v.name, v.sort_order, true
from auth.users u
cross join (
  values
    ('painting', 'Painting', 10),
    ('handyman', 'Handyman', 20),
    ('insurance', 'Insurance', 30),
    ('prep', 'Prep & repair', 40),
    ('consulting', 'Consulting', 50)
) as v(slug, name, sort_order)
where not exists (
  select 1 from public.mp_service_categories c where c.user_id = u.id and c.slug = v.slug
);
