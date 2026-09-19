export type ServiceFieldSchema = {
  version?: number;
  rooms?: { label?: string; min?: number; max?: number; default?: number };
  room_fields?: ServiceFieldDef[];
  fields?: ServiceFieldDef[];
  deductions?: { door_sqm?: number; window_sqm?: number };
};

export type ServiceFieldDef = {
  key: string;
  type: string;
  label: string;
  required?: boolean;
  default?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  options?: string[];
};

export type MpService = {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  measure_type: "room_walls" | "sqm" | "lm" | "fixed" | "on_site";
  rate_per_unit: number;
  min_charge: number;
  unit_label: string;
  field_schema: ServiceFieldSchema;
  sort_order: number;
  active: boolean;
  show_estimate: boolean;
  created_at: string;
  updated_at: string;
};
