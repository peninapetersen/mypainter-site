import { getSupabase } from "@/lib/supabase";

export async function requireUserId(): Promise<string> {
  const supabase = getSupabase();

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user?.id) {
    const exp = sessionData.session.expires_at;
    const expiresSoon = exp != null && exp * 1000 < Date.now() + 60_000;
    if (expiresSoon) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session?.user?.id) return refreshed.session.user.id;
    }
    return sessionData.session.user.id;
  }

  const { data, error } = await supabase.auth.getUser();
  if (data.user?.id) return data.user.id;

  if (error?.message?.includes("JWT") || error?.status === 401) {
    throw new Error("Session expired — please sign out and sign in again.");
  }
  throw new Error("Not signed in — please sign in again.");
}
