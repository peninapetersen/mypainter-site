import { json } from "../../../_lib/auth.js";
import { supabaseRest } from "../../../_lib/supabase-admin.js";

async function loadQuote(env, token) {
  const rows = await supabaseRest(env, `mp_quotes?approval_token=eq.${encodeURIComponent(token)}&select=*&limit=1`);
  return rows?.[0] ?? null;
}

export async function onRequestGet(context) {
  try {
    const quote = await loadQuote(context.env, context.params.token);
    if (!quote) return json({ error: "Quote not found" }, 404);
    return json({
      quote: {
        number: quote.number,
        title: quote.title,
        quote_date: quote.quote_date,
        valid_until: quote.valid_until,
        line_items: quote.line_items,
        subtotal: quote.subtotal,
        discount: quote.discount,
        gst: quote.gst,
        total: quote.total,
        terms: quote.terms,
        status: quote.status,
      },
    });
  } catch (e) {
    return json({ error: e.message || "Failed to load quote" }, 500);
  }
}

export async function onRequestPost(context) {
  const env = context.env;
  try {
    const token = context.params.token;
    const body = await context.request.json().catch(() => ({}));
    const action = body.action === "decline" ? "decline" : "approve";

    const quote = await loadQuote(env, token);
    if (!quote) return json({ error: "Quote not found" }, 404);
    if (quote.status === "approved") return json({ ok: true, status: "approved", already: true });
    if (quote.status === "declined") return json({ error: "Quote already declined" }, 400);

    if (action === "decline") {
      await supabaseRest(env, `mp_quotes?id=eq.${quote.id}`, {
        method: "PATCH",
        body: { status: "declined" },
        prefer: "return=minimal",
      });
      return json({ ok: true, status: "declined" });
    }

    await supabaseRest(env, `mp_quotes?id=eq.${quote.id}`, {
      method: "PATCH",
      body: { status: "approved", approved_at: new Date().toISOString() },
      prefer: "return=minimal",
    });

    const leads = await supabaseRest(env, `mp_jobs?quote_id=eq.${quote.id}&select=id,site_address&limit=1`);
    let lead = leads?.[0] ?? null;
    if (!lead && quote.request_id) {
      const byReq = await supabaseRest(env, `mp_jobs?request_id=eq.${quote.request_id}&select=id,site_address&limit=1`);
      lead = byReq?.[0] ?? null;
    }

    const existing = await supabaseRest(env, `mp_jobs_on?quote_id=eq.${quote.id}&select=id,number&limit=1`);
    if (existing?.[0]) {
      return json({ ok: true, status: "approved", jobs_on_id: existing[0].id, number: existing[0].number });
    }

    const allOn = await supabaseRest(env, `mp_jobs_on?user_id=eq.${quote.user_id}&select=id`);
    const num = (Array.isArray(allOn) ? allOn.length : 0) + 1;
    const number = `ON-${String(num).padStart(3, "0")}`;

    const inserted = await supabaseRest(env, "mp_jobs_on", {
      method: "POST",
      body: {
        user_id: quote.user_id,
        lead_id: lead?.id ?? null,
        quote_id: quote.id,
        request_id: quote.request_id,
        client_id: quote.client_id,
        number,
        title: quote.title || `Job ${quote.number}`,
        site_address: lead?.site_address ?? "",
        line_items: quote.line_items ?? [],
        notes: "",
        status: "active",
        approved_at: new Date().toISOString(),
      },
      prefer: "return=representation",
    });

    const jobsOn = Array.isArray(inserted) ? inserted[0] : inserted;

    const cards = await supabaseRest(env, `mp_pipeline_opportunities?quote_id=eq.${quote.id}&select=id&limit=1`);
    if (cards?.[0]?.id) {
      await supabaseRest(env, `mp_pipeline_opportunities?id=eq.${cards[0].id}`, {
        method: "PATCH",
        body: {
          stage: "jobs_on",
          jobs_on_id: jobsOn.id,
          job_id: lead?.id ?? null,
          title: jobsOn.title || number,
        },
        prefer: "return=minimal",
      });
    }

    return json({ ok: true, status: "approved", jobs_on_id: jobsOn.id, number: jobsOn.number });
  } catch (e) {
    return json({ error: e.message || "Approval failed" }, 500);
  }
}
