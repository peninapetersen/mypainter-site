import { requireUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { ScheduleEventKind, ScheduleEventRecord } from "@/types/entities";

export async function listScheduleEventsInRange(startIso: string, endIso: string): Promise<ScheduleEventRecord[]> {
  const { data, error } = await supabase
    .from("mp_schedule_events")
    .select("*")
    .gte("starts_at", startIso)
    .lte("starts_at", endIso)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ScheduleEventRecord[];
}

export async function createScheduleEvent(input: {
  kind: ScheduleEventKind;
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string | null;
  all_day?: boolean;
  assigned_to?: string;
  client_id?: string | null;
}): Promise<ScheduleEventRecord> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from("mp_schedule_events")
    .insert({
      user_id,
      kind: input.kind,
      title: input.title,
      description: input.description ?? "",
      starts_at: input.starts_at,
      ends_at: input.ends_at ?? null,
      all_day: input.all_day ?? false,
      assigned_to: input.assigned_to ?? "",
      client_id: input.client_id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ScheduleEventRecord;
}

export async function deleteScheduleEvent(id: string): Promise<void> {
  const { error } = await supabase.from("mp_schedule_events").delete().eq("id", id);
  if (error) throw error;
}
