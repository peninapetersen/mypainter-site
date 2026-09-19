import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let _client: SupabaseClient<Database> | null = null;

function bakedKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
}

function bakedUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL ?? "https://jkampxliebnzsevvmqre.supabase.co";
}

function createSupabaseClient(url: string, anonKey: string): SupabaseClient<Database> {
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/** Call once before rendering the app. Loads Cloudflare config if build has no anon key. */
export async function initSupabase(): Promise<SupabaseClient<Database>> {
  if (_client) return _client;

  let url = bakedUrl();
  let anonKey = bakedKey();

  if (!anonKey || anonKey === "missing-anon-key") {
    const res = await fetch("/api/public/app-config");
    if (!res.ok) {
      throw new Error(
        "Supabase not configured — set VITE_SUPABASE_ANON_KEY in Cloudflare Pages environment variables.",
      );
    }
    const cfg = (await res.json()) as { url: string; anonKey: string };
    url = cfg.url;
    anonKey = cfg.anonKey;
  }

  if (!anonKey) {
    throw new Error("Supabase anon key missing");
  }

  _client = createSupabaseClient(url, anonKey);
  return _client;
}

export function getSupabase(): SupabaseClient<Database> {
  if (!_client) {
    throw new Error("Supabase not initialised — initSupabase() must run first");
  }
  return _client;
}

/** Lazy proxy so existing imports keep working after initSupabase(). */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    const client = getSupabase();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
