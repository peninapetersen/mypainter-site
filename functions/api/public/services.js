import { json } from "../../_lib/auth.js";
import { getDefaultCatalog } from "../../_lib/default-services.js";
import { ensureServicesSeeded } from "../../_lib/supabase-admin.js";

export async function onRequestGet(context) {
  const { env } = context;
  try {
    let rows = await ensureServicesSeeded(env);
    if (!rows.length) {
      // Show catalogue even before DB seed (owner not found yet)
      rows = getDefaultCatalog().map((s) => ({ id: s.slug, ...s }));
    }
    return json({ services: rows });
  } catch (e) {
    const rows = getDefaultCatalog().map((s) => ({ id: s.slug, ...s }));
    return json({ services: rows, warning: e instanceof Error ? e.message : "Using built-in catalogue" });
  }
}
