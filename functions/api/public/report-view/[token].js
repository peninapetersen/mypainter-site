import { json } from "../../../_lib/auth.js";
import { supabaseConfig, supabaseRest } from "../../../_lib/supabase-admin.js";

const BUCKET = "mypainter-reports";

async function signPhoto(env, path, serviceKey) {
  const { url } = supabaseConfig(env);
  const res = await fetch(`${url}/storage/v1/object/sign/${BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "POST",
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.signedURL ? `${url}/storage/v1${data.signedURL}` : null;
}

/** Customer-facing report: no prices, no internal notes. Photos are signed for an hour each time the page loads. */
export async function onRequestGet(context) {
  const serviceKey = context.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY" }, 500);
  try {
    const token = String(context.params.token || "");
    if (!/^[a-f0-9]{16,64}$/i.test(token)) return json({ error: "Report not found" }, 404);
    const rows = await supabaseRest(context.env, `mp_reports?view_token=eq.${encodeURIComponent(token)}&select=*&limit=1`, { apiKey: serviceKey });
    const r = rows?.[0];
    if (!r) return json({ error: "Report not found" }, 404);

    let client = null;
    if (r.client_id) {
      const cs = await supabaseRest(
        context.env,
        `mp_clients?id=eq.${r.client_id}&select=id,name,email,phone,address,company_name,first_name,last_name&limit=1`,
        { apiKey: serviceKey },
      );
      const c = cs?.[0];
      if (c) {
        const parts = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
        client = { ...c, display_name: c.company_name?.trim() || parts || c.name || "Customer" };
      }
    }

    const areas = [];
    for (const a of Array.isArray(r.areas) ? r.areas : []) {
      const photos = [];
      for (const p of Array.isArray(a.photos) ? a.photos.slice(0, 12) : []) {
        if (typeof p !== "string" || !p.startsWith(`${r.user_id}/`)) continue; // only this owner's pictures
        const signed = await signPhoto(context.env, p, serviceKey);
        if (signed) photos.push(signed);
      }
      areas.push({ area: a.area || "", finding: a.finding || "", recommended: a.recommended || "", photos });
    }

    return json({
      report: {
        number: r.number,
        title: r.title,
        report_date: r.report_date,
        site_address: r.site_address,
        summary: r.summary,
        areas,
        recommendations: r.recommendations,
      },
      client,
    });
  } catch (e) {
    return json({ error: e.message || "Failed to load report" }, 500);
  }
}
