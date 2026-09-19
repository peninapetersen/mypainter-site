/** Default MyPainter service catalogue — used when mp_services is empty. */

const ROOM_FIELDS = [
  { key: "name", type: "text", label: "Room name", default: "Living room" },
  { key: "length", type: "number", label: "Length (m)", required: true, min: 1, max: 20, step: 0.1 },
  { key: "width", type: "number", label: "Width (m)", required: true, min: 1, max: 20, step: 0.1 },
  { key: "height", type: "number", label: "Height (m)", default: 2.4, min: 2, max: 4, step: 0.1 },
  { key: "doors", type: "number", label: "Doors", default: 1, min: 0, max: 5 },
  { key: "windows", type: "number", label: "Windows", default: 1, min: 0, max: 10 },
];

const DEDUCTIONS = { door_sqm: 1.8, window_sqm: 1.2 };

const CATALOG = [
  {
    slug: "interior-room",
    name: "Interior — single room",
    description: "Walls and ceiling for one room. Furniture covered, floors protected, low-VOC paint.",
    category: "painting",
    measure_type: "room_walls",
    rate_per_unit: 18,
    min_charge: 350,
    unit_label: "sqm",
    field_schema: { version: 1, rooms: { label: "Rooms to paint", min: 1, max: 1, default: 1 }, room_fields: ROOM_FIELDS, deductions: DEDUCTIONS },
    sort_order: 10,
    show_estimate: true,
  },
  {
    slug: "interior-house",
    name: "Interior — whole house",
    description: "Multiple rooms or full interior repaint. Price per square metre of wall area.",
    category: "painting",
    measure_type: "room_walls",
    rate_per_unit: 16,
    min_charge: 800,
    unit_label: "sqm",
    field_schema: { version: 1, rooms: { label: "How many rooms?", min: 2, max: 15, default: 4 }, room_fields: ROOM_FIELDS, deductions: DEDUCTIONS },
    sort_order: 20,
    show_estimate: true,
  },
  {
    slug: "wallpaper-room",
    name: "Wallpaper — one room",
    description: "Wallpaper supply and hang for one room, including prep and paste.",
    category: "painting",
    measure_type: "room_walls",
    rate_per_unit: 55,
    min_charge: 450,
    unit_label: "sqm",
    field_schema: { version: 1, rooms: { label: "Rooms", min: 1, max: 3, default: 1 }, room_fields: ROOM_FIELDS, deductions: DEDUCTIONS },
    sort_order: 30,
    show_estimate: true,
  },
  {
    slug: "exterior-weatherboard",
    name: "Exterior — weatherboard",
    description: "Weatherboards, fascia and soffits. Northland-tough exterior paint.",
    category: "painting",
    measure_type: "sqm",
    rate_per_unit: 45,
    min_charge: 600,
    unit_label: "sqm",
    field_schema: {
      version: 1,
      fields: [
        { key: "sqm", type: "number", label: "Approx. wall area (sqm)", required: true, min: 10, max: 500, step: 1, hint: "Rough guess is fine — Richo will confirm on site" },
        { key: "storeys", type: "select", label: "Storeys", options: ["Single storey", "Two storey", "Split level"], default: "Single storey" },
        { key: "scaffolding", type: "boolean", label: "Scaffolding likely needed?", default: false },
      ],
    },
    sort_order: 40,
    show_estimate: true,
  },
  {
    slug: "roof-painting",
    name: "Roof painting",
    description: "Tile or metal roof wash, treat moss/lichen, and weatherproof coating.",
    category: "painting",
    measure_type: "sqm",
    rate_per_unit: 35,
    min_charge: 900,
    unit_label: "sqm",
    field_schema: {
      version: 1,
      fields: [
        { key: "sqm", type: "number", label: "Roof area (sqm)", required: true, min: 50, max: 800, step: 1 },
        { key: "roof_type", type: "select", label: "Roof type", options: ["Concrete tile", "Metal / Colorsteel", "Other / not sure"], default: "Concrete tile" },
      ],
    },
    sort_order: 50,
    show_estimate: true,
  },
  {
    slug: "deck-fence-shed",
    name: "Deck, fence or shed",
    description: "Stain or paint for decks, fences, gates and sheds.",
    category: "painting",
    measure_type: "sqm",
    rate_per_unit: 28,
    min_charge: 250,
    unit_label: "sqm",
    field_schema: {
      version: 1,
      fields: [
        { key: "sqm", type: "number", label: "Area to coat (sqm)", required: true, min: 5, max: 300, step: 1 },
        { key: "surface", type: "select", label: "Surface", options: ["Deck", "Fence", "Shed", "Gate", "Mixed"], default: "Deck" },
        { key: "condition", type: "select", label: "Condition", options: ["Good — recoat only", "Fair — light prep", "Poor — heavy prep"], default: "Good — recoat only" },
      ],
    },
    sort_order: 60,
    show_estimate: true,
  },
  {
    slug: "handyman",
    name: "Handyman work",
    description: "Gib, plastering, repairs, water-blasting and small renovations.",
    category: "handyman",
    measure_type: "on_site",
    rate_per_unit: 0,
    min_charge: 0,
    unit_label: "job",
    field_schema: {
      version: 1,
      fields: [
        { key: "job_type", type: "select", label: "What do you need?", options: ["Gib repair", "Plastering", "Fence repair", "Water-blasting", "General maintenance", "Other"], default: "General maintenance" },
        { key: "description", type: "textarea", label: "Describe the job", required: true },
      ],
    },
    sort_order: 70,
    show_estimate: false,
  },
  {
    slug: "insurance",
    name: "Insurance job",
    description: "Insurance or EQC-related painting and repair work.",
    category: "insurance",
    measure_type: "on_site",
    rate_per_unit: 0,
    min_charge: 0,
    unit_label: "job",
    field_schema: {
      version: 1,
      fields: [
        { key: "claim_number", type: "text", label: "Claim number (if you have one)" },
        { key: "insurer", type: "text", label: "Insurer / assessor" },
        { key: "description", type: "textarea", label: "What needs doing?", required: true },
      ],
    },
    sort_order: 80,
    show_estimate: false,
  },
];

export function getDefaultCatalog() {
  return CATALOG.map((s) => ({ ...s, active: true }));
}

/** @param {string} userId */
export function getDefaultRowsForUser(userId) {
  return CATALOG.map((s) => ({
    user_id: userId,
    ...s,
    active: true,
  }));
}

/** @param {string} slug */
export function getDefaultBySlug(slug) {
  const row = CATALOG.find((s) => s.slug === slug);
  if (!row) return null;
  return { id: null, ...row, active: true };
}
