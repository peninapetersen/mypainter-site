import { getDefaultRowsForUser } from "./default-services.js";

export function supabaseConfig(env) {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://jkampxliebnzsevvmqre.supabase.co";
  const anonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
  return { url, anonKey, serviceKey };
}

/** @param {Record<string, string>} env */
export async function supabaseRest(env, path, { method = "GET", body, prefer, apiKey } = {}) {
  const { url, anonKey, serviceKey } = supabaseConfig(env);
  const key = apiKey || serviceKey || anonKey;
  if (!key) throw new Error("Supabase not configured on server");

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;

  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg = typeof data === "object" && data?.message ? data.message : text || res.statusText;
    throw new Error(msg);
  }
  return data;
}

/** @param {Record<string, string>} env */
export async function getOwnerUserId(env) {
  if (env.MYPAINTER_OWNER_USER_ID) return env.MYPAINTER_OWNER_USER_ID;

  const paths = [
    "mp_services?select=user_id&limit=1",
    "mp_work_settings?select=user_id&limit=1",
    "mp_clients?select=user_id&limit=1",
    "mp_requests?select=user_id&limit=1",
    "mp_quotes?select=user_id&limit=1",
  ];

  for (const path of paths) {
    try {
      const rows = await supabaseRest(env, path);
      if (rows?.[0]?.user_id) return rows[0].user_id;
    } catch {
      /* try next */
    }
  }

  const { url, serviceKey } = supabaseConfig(env);
  if (serviceKey) {
    try {
      const res = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        const id = data.users?.[0]?.id ?? data?.id;
        if (id) return id;
      }
    } catch {
      /* no auth admin */
    }
  }

  return null;
}

const PUBLIC_FIELDS =
  "id,slug,name,description,category,measure_type,rate_per_unit,min_charge,unit_label,field_schema,sort_order,show_estimate";

/** @param {Record<string, string>} env */
export async function listActiveServices(env) {
  return supabaseRest(env, `mp_services?active=eq.true&select=${PUBLIC_FIELDS}&order=sort_order.asc`);
}

/** Auto-seed mp_services when table is empty but an app user exists. */
export async function ensureServicesSeeded(env) {
  let rows = await listActiveServices(env);
  if (rows?.length) return rows;

  const userId = await getOwnerUserId(env);
  if (!userId) return [];

  const payload = getDefaultRowsForUser(userId);
  try {
    await supabaseRest(env, "mp_services", {
      method: "POST",
      body: payload,
      prefer: "return=minimal,resolution=ignore-duplicates",
    });
  } catch {
    /* rows may partially exist */
  }

  rows = await listActiveServices(env);
  return rows ?? [];
}
