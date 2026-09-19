import { createSessionCookie, json } from "../../_lib/auth.js";

async function verifySupabaseUser(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://jkampxliebnzsevvmqre.supabase.co";
  const anon = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  if (!anon) return null;
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anon },
  });
  if (!res.ok) return null;
  return res.json();
}

/** Lets /app users edit the public site without a separate admin password. */
export async function onRequestPost(context) {
  const { request, env } = context;
  const secret = env.SESSION_SECRET || env.ADMIN_PASSWORD;
  if (!secret) {
    return json({ error: "CMS session not configured on Cloudflare" }, 500);
  }
  const user = await verifySupabaseUser(request, env);
  if (!user?.id) {
    return json({ error: "Sign in to the business app first" }, 401);
  }
  const cookie = await createSessionCookie(env);
  return json({ ok: true, email: user.email ?? null }, 200, { "Set-Cookie": cookie });
}
