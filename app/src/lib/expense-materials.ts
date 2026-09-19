import type { ExpenseCategory } from "@/types/entities";

export type ExpenseMaterialPreset = {
  item_name: string;
  description: string;
  category: ExpenseCategory;
  accounting_code: string;
};

/** Default IR/chart codes per category when no material preset is chosen. */
export const EXPENSE_CATEGORY_CODES: Record<ExpenseCategory, string> = {
  COGS_Materials: "3100",
  Motor_Vehicle: "4200",
  Tools_Equipment: "4300",
  Subcontractors: "5100",
  Admin_Insurance: "6100",
};

/** Common painter materials — tap to pre-fill item, category, and code. */
export const EXPENSE_MATERIAL_PRESETS: ExpenseMaterialPreset[] = [
  { item_name: "Charcoal Paint", description: "Charcoal paint — walls/trim", category: "COGS_Materials", accounting_code: "3100" },
  { item_name: "White Paint", description: "White wall paint", category: "COGS_Materials", accounting_code: "3100" },
  { item_name: "Ceiling White", description: "Ceiling flat white", category: "COGS_Materials", accounting_code: "3100" },
  { item_name: "Undercoat / Primer", description: "Sealer or primer coat", category: "COGS_Materials", accounting_code: "3101" },
  { item_name: "Wood Filler", description: "Prep — holes and cracks", category: "COGS_Materials", accounting_code: "3101" },
  { item_name: "Gap Filler / Caulk", description: "Flexible gap sealant", category: "COGS_Materials", accounting_code: "3101" },
  { item_name: "Sandpaper", description: "Abrasive sheets / discs", category: "COGS_Materials", accounting_code: "3101" },
  { item_name: "Masking Tape", description: "Edge masking", category: "COGS_Materials", accounting_code: "3101" },
  { item_name: "Drop Sheets", description: "Floor / furniture protection", category: "COGS_Materials", accounting_code: "3101" },
  { item_name: "Brush Set", description: "Cut-in and detail brushes", category: "COGS_Materials", accounting_code: "3102" },
  { item_name: "Roller & Sleeve", description: "Roller frame and cover", category: "COGS_Materials", accounting_code: "3102" },
  { item_name: "Turps / Cleaner", description: "Thinners or wash-up", category: "COGS_Materials", accounting_code: "3100" },
  { item_name: "Fuel", description: "Vehicle fuel for job travel", category: "Motor_Vehicle", accounting_code: "4200" },
  { item_name: "Parking", description: "Job-site parking", category: "Motor_Vehicle", accounting_code: "4201" },
];

export function findMaterialPreset(itemName: string): ExpenseMaterialPreset | undefined {
  const key = itemName.trim().toLowerCase();
  return EXPENSE_MATERIAL_PRESETS.find((p) => p.item_name.toLowerCase() === key);
}
