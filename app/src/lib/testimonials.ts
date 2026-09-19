import { requireUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Testimonial } from "@/types/entities";

export async function listTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase.from("mp_testimonials").select("*").order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Testimonial[];
}

export async function getTestimonial(id: string): Promise<Testimonial | null> {
  const { data, error } = await supabase.from("mp_testimonials").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Testimonial | null;
}

export async function getTestimonialByInvoice(invoiceId: string): Promise<Testimonial | null> {
  const { data, error } = await supabase
    .from("mp_testimonials")
    .select("*")
    .eq("invoice_id", invoiceId)
    .maybeSingle();
  if (error) throw error;
  return data as Testimonial | null;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from("mp_testimonials").delete().eq("id", id);
  if (error) throw error;
}

export function newTestimonialToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
