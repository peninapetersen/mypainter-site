/** Turn Supabase/PostgREST errors into plain English for the red banner. */
export function formatSupabaseError(err: unknown): string {
  if (!(err instanceof Error) && typeof err !== "object" || !err) {
    return "Save failed";
  }
  const e = err as { message?: string; code?: string; details?: string; hint?: string };
  const msg = e.message ?? "Save failed";

  if (msg.includes("mp_account_codes")) {
    return `${msg} — Run migration 019 in Supabase SQL editor: supabase/migrations/019_suppliers_tax_accounting.sql`;
  }

  if (msg.includes("mp_suppliers") || msg.includes("mp_contractors")) {
    return `${msg} — Run migration 018 in Supabase SQL editor: supabase/migrations/018_contacts_contractors_timesheets.sql`;
  }

  if (
    msg.includes("mp_client_properties") ||
    msg.includes("mp_client_contacts") ||
    msg.includes("first_name") ||
    msg.includes("company_name") ||
    msg.includes("communication_settings")
  ) {
    return `${msg} — Run migration 002 in Supabase (Jobber client fields).`;
  }

  if (
    msg.includes("Not signed in") ||
    msg.includes("Session expired") ||
    msg.includes("JWT") ||
    msg.includes("Not authenticated") ||
    e.code === "PGRST301"
  ) {
    return "Session expired — sign out (top right), sign in again, then retry.";
  }

  return msg;
}

export function isMissingTableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("mp_suppliers") ||
    msg.includes("mp_contractors") ||
    msg.includes("mp_client_properties") ||
    msg.includes("mp_client_contacts") ||
    msg.includes("Could not find the table") ||
    msg.includes("42P01")
  );
}
