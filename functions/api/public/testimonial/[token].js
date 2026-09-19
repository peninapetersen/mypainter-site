import { json } from "../../../_lib/auth.js";
import { supabaseRest } from "../../../_lib/supabase-admin.js";

async function loadInvoice(env, token) {
  const rows = await supabaseRest(env, `mp_invoices?testimonial_token=eq.${encodeURIComponent(token)}&select=*&limit=1`);
  return rows?.[0] ?? null;
}

export async function onRequestGet(context) {
  try {
    const inv = await loadInvoice(context.env, context.params.token);
    if (!inv) return json({ error: "Invoice not found" }, 404);
    return json({
      invoice: {
        number: inv.number,
        subject: inv.subject,
        total: inv.total,
        status: inv.status,
      },
    });
  } catch (e) {
    return json({ error: e.message || "Failed to load" }, 500);
  }
}

export async function onRequestPost(context) {
  const env = context.env;
  try {
    const token = context.params.token;
    const body = await context.request.json().catch(() => ({}));
    const inv = await loadInvoice(env, token);
    if (!inv) return json({ error: "Invoice not found" }, 404);

    const customer_name = String(body.customer_name || "").trim().slice(0, 120);
    const review_text = String(body.review_text || "").trim().slice(0, 4000);
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
    if (!customer_name || !review_text) return json({ error: "Name and review required" }, 400);

    await supabaseRest(env, "mp_testimonials", {
      method: "POST",
      body: {
        user_id: inv.user_id,
        client_id: inv.client_id,
        lead_id: inv.job_id,
        quote_id: inv.quote_id,
        jobs_on_id: inv.jobs_on_id,
        invoice_id: inv.id,
        customer_name,
        review_text,
        rating,
        submitted_at: new Date().toISOString(),
      },
      prefer: "return=minimal",
    });

    const cards = await supabaseRest(env, `mp_pipeline_opportunities?invoice_id=eq.${inv.id}&select=id&limit=1`);
    if (cards?.[0]?.id) {
      await supabaseRest(env, `mp_pipeline_opportunities?id=eq.${cards[0].id}`, {
        method: "PATCH",
        body: { testimonial_received: true, stage: "testimonial" },
        prefer: "return=minimal",
      });
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message || "Submit failed" }, 500);
  }
}
