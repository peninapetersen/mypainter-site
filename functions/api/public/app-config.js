import { json } from "../../_lib/auth.js";

/** Public Supabase config for the /app SPA (anon key is safe to expose). */
export async function onRequestGet(context) {
  const { env } = context;
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://jkampxliebnzsevvmqre.supabase.co";
  const anonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";
  if (!anonKey) {
    return json({ error: "VITE_SUPABASE_ANON_KEY not set on Cloudflare Pages" }, 503);
  }
  return json({ url, anonKey });
}
