import { requireUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { CrewTimesheet } from "@/types/entities";

export async function listTimesheets(): Promise<CrewTimesheet[]> {
  const { data, error } = await supabase
    .from("mp_crew_timesheets")
    .select("*")
    .order("check_in_time", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CrewTimesheet[];
}

export async function listTimesheetsForJob(jobId: string): Promise<CrewTimesheet[]> {
  const { data, error } = await supabase
    .from("mp_crew_timesheets")
    .select("*")
    .eq("job_id", jobId)
    .order("check_in_time", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CrewTimesheet[];
}

export async function listTimesheetsForJobsOn(jobsOnId: string): Promise<CrewTimesheet[]> {
  const { data, error } = await supabase
    .from("mp_crew_timesheets")
    .select("*")
    .eq("jobs_on_id", jobsOnId)
    .order("check_in_time", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CrewTimesheet[];
}

export async function getTimesheet(id: string): Promise<CrewTimesheet | null> {
  const { data, error } = await supabase.from("mp_crew_timesheets").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as CrewTimesheet | null;
}

function durationSeconds(checkIn: string | null, checkOut: string | null): number | null {
  if (!checkIn || !checkOut) return null;
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return ms > 0 ? Math.round(ms / 1000) : null;
}

export async function createTimesheet(input: {
  crew_member?: string;
  job_id?: string | null;
  jobs_on_id?: string | null;
  contractor_id?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
}): Promise<CrewTimesheet> {
  const user_id = await requireUserId();
  const check_in_time = input.check_in_time ?? new Date().toISOString();
  const check_out_time = input.check_out_time ?? null;
  const row = {
    user_id,
    crew_member: input.crew_member ?? "Richo Petersen",
    job_id: input.job_id ?? null,
    jobs_on_id: input.jobs_on_id ?? null,
    contractor_id: input.contractor_id ?? null,
    check_in_time,
    check_out_time,
    duration_seconds: durationSeconds(check_in_time, check_out_time),
  };
  const { data, error } = await supabase.from("mp_crew_timesheets").insert(row).select("*").single();
  if (error && /column|schema cache|PGRST204/i.test(error.message)) {
    const basic = { ...row };
    delete (basic as Record<string, unknown>).jobs_on_id;
    delete (basic as Record<string, unknown>).contractor_id;
    const { data: data2, error: error2 } = await supabase.from("mp_crew_timesheets").insert(basic).select("*").single();
    if (error2) throw error2;
    return data2 as CrewTimesheet;
  }
  if (error) throw error;
  return data as CrewTimesheet;
}

export async function updateTimesheet(id: string, input: Partial<CrewTimesheet>): Promise<CrewTimesheet> {
  const check_in = input.check_in_time;
  const check_out = input.check_out_time;
  const patch = { ...input } as Partial<CrewTimesheet>;
  if (check_in !== undefined || check_out !== undefined) {
    const existing = await getTimesheet(id);
    patch.duration_seconds = durationSeconds(
      check_in ?? existing?.check_in_time ?? null,
      check_out ?? existing?.check_out_time ?? null,
    );
  }
  const { data, error } = await supabase.from("mp_crew_timesheets").update(patch).eq("id", id).select("*").single();
  if (error && /column|schema cache|PGRST204/i.test(error.message)) {
    const basic = { ...patch };
    delete (basic as Record<string, unknown>).jobs_on_id;
    delete (basic as Record<string, unknown>).contractor_id;
    const { data: data2, error: error2 } = await supabase
      .from("mp_crew_timesheets")
      .update(basic)
      .eq("id", id)
      .select("*")
      .single();
    if (error2) throw error2;
    return data2 as CrewTimesheet;
  }
  if (error) throw error;
  return data as CrewTimesheet;
}

export async function deleteTimesheet(id: string): Promise<void> {
  const { error } = await supabase.from("mp_crew_timesheets").delete().eq("id", id);
  if (error) throw error;
}

export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
