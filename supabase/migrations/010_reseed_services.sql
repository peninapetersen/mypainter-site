-- Re-seed mp_services if quote page is empty.
-- Requires at least one /app user (auth.users row). Safe to re-run.

-- Check first:
-- select count(*) as users from auth.users;
-- select count(*) as services from mp_services;

insert into mp_services (
  user_id, slug, name, description, category, measure_type,
  rate_per_unit, min_charge, unit_label, field_schema, sort_order, show_estimate
)
select
  u.id, v.slug, v.name, v.description, v.category, v.measure_type,
  v.rate_per_unit, v.min_charge, v.unit_label, v.field_schema::jsonb, v.sort_order, v.show_estimate
from auth.users u
cross join (
  values
    ('interior-room', 'Interior — single room', 'Walls and ceiling for one room. Furniture covered, floors protected, low-VOC paint.', 'painting', 'room_walls', 18.00, 350.00, 'sqm', '{"version":1,"rooms":{"label":"Rooms to paint","min":1,"max":1,"default":1},"room_fields":[{"key":"name","type":"text","label":"Room name","default":"Living room"},{"key":"length","type":"number","label":"Length (m)","required":true,"min":1,"max":20,"step":0.1},{"key":"width","type":"number","label":"Width (m)","required":true,"min":1,"max":20,"step":0.1},{"key":"height","type":"number","label":"Height (m)","default":2.4,"min":2,"max":4,"step":0.1},{"key":"doors","type":"number","label":"Doors","default":1,"min":0,"max":5},{"key":"windows","type":"number","label":"Windows","default":1,"min":0,"max":10}],"deductions":{"door_sqm":1.8,"window_sqm":1.2}}', 10, true),
    ('interior-house', 'Interior — whole house', 'Multiple rooms or full interior repaint. Price per square metre of wall area.', 'painting', 'room_walls', 16.00, 800.00, 'sqm', '{"version":1,"rooms":{"label":"How many rooms?","min":2,"max":15,"default":4},"room_fields":[{"key":"name","type":"text","label":"Room name","default":"Bedroom"},{"key":"length","type":"number","label":"Length (m)","required":true},{"key":"width","type":"number","label":"Width (m)","required":true},{"key":"height","type":"number","label":"Height (m)","default":2.4},{"key":"doors","type":"number","label":"Doors","default":1},{"key":"windows","type":"number","label":"Windows","default":1}],"deductions":{"door_sqm":1.8,"window_sqm":1.2}}', 20, true),
    ('wallpaper-room', 'Wallpaper — one room', 'Wallpaper supply and hang for one room, including prep and paste.', 'painting', 'room_walls', 55.00, 450.00, 'sqm', '{"version":1,"rooms":{"label":"Rooms","min":1,"max":3,"default":1},"room_fields":[{"key":"name","type":"text","label":"Room name","default":"Feature wall room"},{"key":"length","type":"number","label":"Length (m)","required":true},{"key":"width","type":"number","label":"Width (m)","required":true},{"key":"height","type":"number","label":"Height (m)","default":2.4},{"key":"doors","type":"number","label":"Doors","default":1},{"key":"windows","type":"number","label":"Windows","default":1}],"deductions":{"door_sqm":1.8,"window_sqm":1.2}}', 30, true),
    ('exterior-weatherboard', 'Exterior — weatherboard', 'Weatherboards, fascia and soffits. Northland-tough exterior paint.', 'painting', 'sqm', 45.00, 600.00, 'sqm', '{"version":1,"fields":[{"key":"sqm","type":"number","label":"Approx. wall area (sqm)","required":true,"min":10,"max":500},{"key":"storeys","type":"select","label":"Storeys","options":["Single storey","Two storey","Split level"],"default":"Single storey"},{"key":"scaffolding","type":"boolean","label":"Scaffolding likely needed?","default":false}]}', 40, true),
    ('roof-painting', 'Roof painting', 'Tile or metal roof wash, treat moss/lichen, and weatherproof coating.', 'painting', 'sqm', 35.00, 900.00, 'sqm', '{"version":1,"fields":[{"key":"sqm","type":"number","label":"Roof area (sqm)","required":true,"min":50,"max":800},{"key":"roof_type","type":"select","label":"Roof type","options":["Concrete tile","Metal / Colorsteel","Other / not sure"],"default":"Concrete tile"}]}', 50, true),
    ('deck-fence-shed', 'Deck, fence or shed', 'Stain or paint for decks, fences, gates and sheds.', 'painting', 'sqm', 28.00, 250.00, 'sqm', '{"version":1,"fields":[{"key":"sqm","type":"number","label":"Area to coat (sqm)","required":true,"min":5,"max":300},{"key":"surface","type":"select","label":"Surface","options":["Deck","Fence","Shed","Gate","Mixed"],"default":"Deck"},{"key":"condition","type":"select","label":"Condition","options":["Good — recoat only","Fair — light prep","Poor — heavy prep"],"default":"Good — recoat only"}]}', 60, true),
    ('handyman', 'Handyman work', 'Gib, plastering, repairs, water-blasting and small renovations.', 'handyman', 'on_site', 0, 0, 'job', '{"version":1,"fields":[{"key":"job_type","type":"select","label":"What do you need?","options":["Gib repair","Plastering","Fence repair","Water-blasting","General maintenance","Other"],"default":"General maintenance"},{"key":"description","type":"textarea","label":"Describe the job","required":true}]}', 70, false),
    ('insurance', 'Insurance job', 'Insurance or EQC-related painting and repair work.', 'insurance', 'on_site', 0, 0, 'job', '{"version":1,"fields":[{"key":"claim_number","type":"text","label":"Claim number (if you have one)"},{"key":"insurer","type":"text","label":"Insurer / assessor"},{"key":"description","type":"textarea","label":"What needs doing?","required":true}]}', 80, false)
) as v(slug, name, description, category, measure_type, rate_per_unit, min_charge, unit_label, field_schema, sort_order, show_estimate)
where not exists (
  select 1 from mp_services s where s.user_id = u.id and s.slug = v.slug
);
