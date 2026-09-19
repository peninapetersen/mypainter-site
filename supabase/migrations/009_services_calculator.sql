-- Service catalogue + measurement fields for public quote calculator
-- Run in: https://supabase.com/dashboard/project/jkampxliebnzsevvmqre/sql

-- ---------------------------------------------------------------------------
-- Services (Richo's rate card — editable in /app later)
-- measure_type:
--   room_walls  — L×W×H per room → wall sqm (minus doors/windows)
--   sqm         — customer enters total square metres
--   lm          — linear metres (fences, etc.)
--   fixed       — flat rate
--   on_site     — no auto estimate; request only
-- ---------------------------------------------------------------------------

create table if not exists mp_services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  name text not null,
  description text not null default '',
  category text not null default 'painting',
  measure_type text not null default 'on_site',
  rate_per_unit numeric(10,2) not null default 0,
  min_charge numeric(10,2) not null default 0,
  unit_label text not null default 'sqm',
  field_schema jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  active boolean not null default true,
  show_estimate boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

-- Link requests to a service + store client measurements / ballpark
alter table mp_requests
  add column if not exists service_id uuid references mp_services(id) on delete set null;

alter table mp_requests
  add column if not exists measurements jsonb not null default '{}'::jsonb;

alter table mp_requests
  add column if not exists estimate_subtotal numeric(10,2) not null default 0;

alter table mp_requests
  add column if not exists source text not null default 'admin';

comment on column mp_requests.source is 'admin | website | contact';
comment on column mp_requests.measurements is 'Client-submitted dimensions, rooms, photos refs, etc.';
comment on column mp_requests.estimate_subtotal is 'Ballpark from calculator — not final quote';

-- updated_at trigger
drop trigger if exists trg_mp_services_updated on mp_services;
create trigger trg_mp_services_updated before update on mp_services
  for each row execute function mp_set_updated_at();

-- RLS
alter table mp_services enable row level security;

drop policy if exists "mp_services_owner" on mp_services;
create policy "mp_services_owner" on mp_services
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public read for active services (quote calculator page)
drop policy if exists "mp_services_public_read" on mp_services;
create policy "mp_services_public_read" on mp_services
  for select using (active = true);

create index if not exists idx_mp_services_user on mp_services(user_id, sort_order);
create index if not exists idx_mp_requests_service on mp_requests(service_id);

-- ---------------------------------------------------------------------------
-- Seed dummy services for every app user (usually Richo)
-- Safe to re-run: skips slugs that already exist per user
-- ---------------------------------------------------------------------------

insert into mp_services (
  user_id, slug, name, description, category, measure_type,
  rate_per_unit, min_charge, unit_label, field_schema, sort_order, show_estimate
)
select
  u.id,
  v.slug,
  v.name,
  v.description,
  v.category,
  v.measure_type,
  v.rate_per_unit,
  v.min_charge,
  v.unit_label,
  v.field_schema::jsonb,
  v.sort_order,
  v.show_estimate
from auth.users u
cross join (
  values
    (
      'interior-room',
      'Interior — single room',
      'Walls and ceiling for one room. Furniture covered, floors protected, low-VOC paint.',
      'painting',
      'room_walls',
      18.00,
      350.00,
      'sqm',
      '{
        "version": 1,
        "rooms": { "label": "Rooms to paint", "min": 1, "max": 1, "default": 1 },
        "room_fields": [
          { "key": "name", "type": "text", "label": "Room name", "default": "Living room" },
          { "key": "length", "type": "number", "label": "Length (m)", "required": true, "min": 1, "max": 20, "step": 0.1 },
          { "key": "width", "type": "number", "label": "Width (m)", "required": true, "min": 1, "max": 20, "step": 0.1 },
          { "key": "height", "type": "number", "label": "Height (m)", "default": 2.4, "min": 2, "max": 4, "step": 0.1 },
          { "key": "doors", "type": "number", "label": "Doors", "default": 1, "min": 0, "max": 5 },
          { "key": "windows", "type": "number", "label": "Windows", "default": 1, "min": 0, "max": 10 }
        ],
        "deductions": { "door_sqm": 1.8, "window_sqm": 1.2 }
      }',
      10,
      true
    ),
    (
      'interior-house',
      'Interior — whole house',
      'Multiple rooms or full interior repaint. Price per square metre of wall area.',
      'painting',
      'room_walls',
      16.00,
      800.00,
      'sqm',
      '{
        "version": 1,
        "rooms": { "label": "How many rooms?", "min": 2, "max": 15, "default": 4 },
        "room_fields": [
          { "key": "name", "type": "text", "label": "Room name", "default": "Bedroom" },
          { "key": "length", "type": "number", "label": "Length (m)", "required": true, "min": 1, "max": 20, "step": 0.1 },
          { "key": "width", "type": "number", "label": "Width (m)", "required": true, "min": 1, "max": 20, "step": 0.1 },
          { "key": "height", "type": "number", "label": "Height (m)", "default": 2.4, "min": 2, "max": 4, "step": 0.1 },
          { "key": "doors", "type": "number", "label": "Doors", "default": 1, "min": 0, "max": 5 },
          { "key": "windows", "type": "number", "label": "Windows", "default": 1, "min": 0, "max": 10 }
        ],
        "deductions": { "door_sqm": 1.8, "window_sqm": 1.2 }
      }',
      20,
      true
    ),
    (
      'wallpaper-room',
      'Wallpaper — one room',
      'Wallpaper supply and hang for one room, including prep and paste.',
      'painting',
      'room_walls',
      55.00,
      450.00,
      'sqm',
      '{
        "version": 1,
        "rooms": { "label": "Rooms", "min": 1, "max": 3, "default": 1 },
        "room_fields": [
          { "key": "name", "type": "text", "label": "Room name", "default": "Feature wall room" },
          { "key": "length", "type": "number", "label": "Length (m)", "required": true, "min": 1, "max": 20, "step": 0.1 },
          { "key": "width", "type": "number", "label": "Width (m)", "required": true, "min": 1, "max": 20, "step": 0.1 },
          { "key": "height", "type": "number", "label": "Height (m)", "default": 2.4, "min": 2, "max": 4, "step": 0.1 },
          { "key": "doors", "type": "number", "label": "Doors", "default": 1, "min": 0, "max": 5 },
          { "key": "windows", "type": "number", "label": "Windows", "default": 1, "min": 0, "max": 10 }
        ],
        "deductions": { "door_sqm": 1.8, "window_sqm": 1.2 }
      }',
      30,
      true
    ),
    (
      'exterior-weatherboard',
      'Exterior — weatherboard',
      'Weatherboards, fascia and soffits. Northland-tough exterior paint.',
      'painting',
      'sqm',
      45.00,
      600.00,
      'sqm',
      '{
        "version": 1,
        "fields": [
          { "key": "sqm", "type": "number", "label": "Approx. wall area (sqm)", "required": true, "min": 10, "max": 500, "step": 1, "hint": "Rough guess is fine — Richo will confirm on site" },
          { "key": "storeys", "type": "select", "label": "Storeys", "options": ["Single storey", "Two storey", "Split level"], "default": "Single storey" },
          { "key": "scaffolding", "type": "boolean", "label": "Scaffolding likely needed?", "default": false }
        ]
      }',
      40,
      true
    ),
    (
      'roof-painting',
      'Roof painting',
      'Tile or metal roof wash, treat moss/lichen, and weatherproof coating.',
      'painting',
      'sqm',
      35.00,
      900.00,
      'sqm',
      '{
        "version": 1,
        "fields": [
          { "key": "sqm", "type": "number", "label": "Roof area (sqm)", "required": true, "min": 50, "max": 800, "step": 1 },
          { "key": "roof_type", "type": "select", "label": "Roof type", "options": ["Concrete tile", "Metal / Colorsteel", "Other / not sure"], "default": "Concrete tile" }
        ]
      }',
      50,
      true
    ),
    (
      'deck-fence-shed',
      'Deck, fence or shed',
      'Stain or paint for decks, fences, gates and sheds.',
      'painting',
      'sqm',
      28.00,
      250.00,
      'sqm',
      '{
        "version": 1,
        "fields": [
          { "key": "sqm", "type": "number", "label": "Area to coat (sqm)", "required": true, "min": 5, "max": 300, "step": 1 },
          { "key": "surface", "type": "select", "label": "Surface", "options": ["Deck", "Fence", "Shed", "Gate", "Mixed"], "default": "Deck" },
          { "key": "condition", "type": "select", "label": "Condition", "options": ["Good — recoat only", "Fair — light prep", "Poor — heavy prep"], "default": "Good — recoat only" }
        ]
      }',
      60,
      true
    ),
    (
      'handyman',
      'Handyman work',
      'Gib, plastering, repairs, water-blasting and small renovations.',
      'handyman',
      'on_site',
      0,
      0,
      'job',
      '{
        "version": 1,
        "fields": [
          { "key": "job_type", "type": "select", "label": "What do you need?", "options": ["Gib repair", "Plastering", "Fence repair", "Water-blasting", "General maintenance", "Other"], "default": "General maintenance" },
          { "key": "description", "type": "textarea", "label": "Describe the job", "required": true }
        ]
      }',
      70,
      false
    ),
    (
      'insurance',
      'Insurance job',
      'Insurance or EQC-related painting and repair work.',
      'insurance',
      'on_site',
      0,
      0,
      'job',
      '{
        "version": 1,
        "fields": [
          { "key": "claim_number", "type": "text", "label": "Claim number (if you have one)" },
          { "key": "insurer", "type": "text", "label": "Insurer / assessor" },
          { "key": "description", "type": "textarea", "label": "What needs doing?", "required": true }
        ]
      }',
      80,
      false
    )
) as v(
  slug, name, description, category, measure_type,
  rate_per_unit, min_charge, unit_label, field_schema, sort_order, show_estimate
)
where not exists (
  select 1 from mp_services s
  where s.user_id = u.id and s.slug = v.slug
);
