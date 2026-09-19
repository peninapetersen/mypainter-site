import { requireUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { ServiceCategory } from "@/types/service-categories";

export const SERVICE_CATEGORY_SEEDS: Pick<ServiceCategory, "slug" | "name" | "sort_order" | "active" | "default_account_code">[] = [
  { slug: "painting", name: "Painting", sort_order: 10, active: true, default_account_code: "2000" },
  { slug: "handyman", name: "Handyman", sort_order: 20, active: true, default_account_code: "2100" },
  { slug: "insurance", name: "Insurance", sort_order: 30, active: true, default_account_code: "2100" },
  { slug: "prep", name: "Prep & repair", sort_order: 40, active: true, default_account_code: "2000" },
  { slug: "consulting", name: "Consulting", sort_order: 50, active: true, default_account_code: "2010" },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function defaultCodeForCategory(categories: ServiceCategory[], slug: string): string {
  return categories.find((c) => c.slug === slug)?.default_account_code || "2000";
}

export async function listServiceCategories(activeOnly = false): Promise<ServiceCategory[]> {
  const user_id = await requireUserId();
  let q = supabase.from("mp_service_categories").select("*").order("sort_order").order("name");
  if (activeOnly) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as ServiceCategory[];
  if (rows.length === 0) {
    return seedServiceCategories(user_id);
  }
  return rows.map((row) => ({ ...row, default_account_code: row.default_account_code || "2000" }));
}

export async function seedServiceCategories(user_id: string): Promise<ServiceCategory[]> {
  const rows = SERVICE_CATEGORY_SEEDS.map((seed) => ({ user_id, ...seed }));
  const { data, error } = await supabase.from("mp_service_categories").insert(rows).select("*");
  if (error) throw error;
  return (data ?? []) as ServiceCategory[];
}

export async function createServiceCategory(
  name: string,
  default_account_code = "2000",
): Promise<ServiceCategory> {
  const user_id = await requireUserId();
  const trimmed = name.trim();
  const slug = slugify(trimmed) || `category-${Date.now()}`;
  const row = {
    user_id,
    slug,
    name: trimmed,
    active: true,
    sort_order: 900,
    default_account_code,
  };
  const { data, error } = await supabase.from("mp_service_categories").insert(row).select("*").single();
  if (error && /default_account_code|column|schema cache|PGRST204/i.test(error.message)) {
    const { default_account_code: _, ...basic } = row;
    const { data: data2, error: error2 } = await supabase.from("mp_service_categories").insert(basic).select("*").single();
    if (error2) throw error2;
    return { ...(data2 as ServiceCategory), default_account_code };
  }
  if (error) throw error;
  return data as ServiceCategory;
}

export async function updateServiceCategory(
  id: string,
  patch: Partial<Pick<ServiceCategory, "name" | "active" | "sort_order" | "default_account_code">>,
): Promise<ServiceCategory> {
  const { data, error } = await supabase.from("mp_service_categories").update(patch).eq("id", id).select("*").single();
  if (error && /default_account_code|column|schema cache|PGRST204/i.test(error.message)) {
    const basic = { ...patch };
    delete (basic as Record<string, unknown>).default_account_code;
    const { data: data2, error: error2 } = await supabase.from("mp_service_categories").update(basic).eq("id", id).select("*").single();
    if (error2) throw error2;
    return data2 as ServiceCategory;
  }
  if (error) throw error;
  return data as ServiceCategory;
}

export function categoryLabel(categories: ServiceCategory[], slug: string): string {
  return categories.find((c) => c.slug === slug)?.name ?? slug.replace(/-/g, " ");
}
