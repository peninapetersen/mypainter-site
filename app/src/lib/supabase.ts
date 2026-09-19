import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn("MyPainter app: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY required");
}

export const supabase = createClient<Database>(
  url ?? "https://jkampxliebnzsevvmqre.supabase.co",
  anonKey ?? "missing-anon-key",
);
