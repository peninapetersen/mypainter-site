import { json } from "../../../_lib/auth.js";
import { supabaseRest } from "../../../_lib/supabase-admin.js";

async function loadQuote(env, token, serviceKey) {
  const rows = await supabaseRest(env, `mp_quotes?approval_token=eq.${encodeURIComponent(token)}&select=*&limit=1`, {
    apiKey: serviceKey,
  });
  return rows?.[0] ?? null;
}

async function loadClient(env, clientId, serviceKey) {
  if (!clientId) return null;
  const rows = await supabaseRest(
    env,
    `mp_clients?id=eq.${clientId}&select=id,name,email,phone,address,company_name,first_name,last_name&limit=1`,
    { apiKey: serviceKey },
  );
  const c = rows?.[0];
  if (!c) return null;
  const parts = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  const display_name = c.company_name?.trim() || parts || c.name || "Customer";
  return { ...c, display_name };
}

function isMissingColumnError(message) {
  return /column|schema cache|PGRST204|does not exist/i.test(String(message || ""));
}

async function rest(env, path, serviceKey, opts = {}) {
  return supabaseRest(env, path, { ...opts, apiKey: serviceKey });
}

function formatPropertyLine(p) {
  return [p.street_1, p.street_2, p.city, p.region, p.postal_code, p.country].filter(Boolean).join(", ");
}

/** Best site address — lead site → client property → client address. */
async function resolveSiteAddress(env, quote, lead, serviceKey) {
  if (lead?.site_address?.trim()) return lead.site_address.trim();
  if (!quote.client_id) return "";
  try {
    const props = await rest(
      env,
      `mp_client_properties?client_id=eq.${quote.client_id}&select=street_1,street_2,city,region,postal_code,country,is_primary,sort_order&order=sort_order.asc&limit=20`,
      serviceKey,
    );
    const list = Array.isArray(props) ? props : [];
    const primary = list.find((p) => p.is_primary) ?? list[0];
    if (primary) {
      const line = formatPropertyLine(primary);
      if (line.trim()) return line;
    }
    const clients = await rest(env, `mp_clients?id=eq.${quote.client_id}&select=address&limit=1`, serviceKey);
    if (clients?.[0]?.address?.trim()) return clients[0].address.trim();
  } catch (e) {
    if (!isMissingColumnError(e.message)) throw e;
  }
  return "";
}

/** Lead row for Jobs On — works before migration 012 (site_address). */
async function findLeadForQuote(env, quote, serviceKey) {
  async function find(filter) {
    try {
      const rows = await rest(env, `mp_jobs?${filter}&select=id,site_address&limit=1`, serviceKey);
      return rows?.[0] ?? null;
    } catch (e) {
      if (!isMissingColumnError(e.message)) throw e;
      const rows = await rest(env, `mp_jobs?${filter}&select=id&limit=1`, serviceKey);
      const row = rows?.[0];
      return row ? { ...row, site_address: "" } : null;
    }
  }

  try {
    const byQuote = await find(`quote_id=eq.${quote.id}`);
    if (byQuote) return byQuote;
  } catch (e) {
    if (!isMissingColumnError(e.message)) throw e;
  }
  if (!quote.request_id) return null;
  try {
    return await find(`request_id=eq.${quote.request_id}`);
  } catch (e) {
    if (isMissingColumnError(e.message)) return null;
    throw e;
  }
}

async function insertJobsOnRow(env, body, serviceKey) {
  const optional = ["lead_id", "quote_id", "request_id", "site_address", "line_items", "notes"];
  try {
    return await rest(env, "mp_jobs_on", serviceKey, {
      method: "POST",
      body,
      prefer: "return=representation",
    });
  } catch (e) {
    if (!isMissingColumnError(e.message)) throw e;
    const basic = { ...body };
    for (const key of optional) delete basic[key];
    return await rest(env, "mp_jobs_on", serviceKey, {
      method: "POST",
      body: basic,
      prefer: "return=representation",
    });
  }
}

async function ensureJobsOnForQuote(env, quote, serviceKey) {
  let existing;
  try {
    existing = await rest(env, `mp_jobs_on?quote_id=eq.${quote.id}&select=id,number,title,status&limit=1`, serviceKey);
  } catch (e) {
    if (/relation.*mp_jobs_on|mp_jobs_on.*does not exist/i.test(e.message)) {
      throw new Error("mp_jobs_on table missing — run migration 017_jobs_on_table_only.sql in Supabase.");
    }
    throw e;
  }
  if (existing?.[0]) {
    const row = existing[0];
    if (row.status === "draft") {
      await rest(env, `mp_jobs_on?id=eq.${row.id}`, serviceKey, {
        method: "PATCH",
        body: {
          status: "active",
          approved_at: new Date().toISOString(),
          title: quote.title || row.title,
          line_items: quote.line_items ?? [],
        },
        prefer: "return=minimal",
      });
      return { ...row, status: "active" };
    }
    return row;
  }

  const lead = await findLeadForQuote(env, quote, serviceKey);
  const site_address = await resolveSiteAddress(env, quote, lead, serviceKey);
  const allOn = await supabaseRest(env, `mp_jobs_on?user_id=eq.${quote.user_id}&select=id`, { apiKey: serviceKey });
  const num = (Array.isArray(allOn) ? allOn.length : 0) + 1;
  const number = `ON-${String(num).padStart(3, "0")}`;

  const inserted = await insertJobsOnRow(
    env,
    {
      user_id: quote.user_id,
      lead_id: lead?.id ?? null,
      quote_id: quote.id,
      request_id: quote.request_id,
      client_id: quote.client_id,
      number,
      title: quote.title || `Job ${quote.number}`,
      site_address,
      line_items: quote.line_items ?? [],
      notes: "",
      status: "active",
      approved_at: new Date().toISOString(),
    },
    serviceKey,
  );

  const jobsOn = Array.isArray(inserted) ? inserted[0] : inserted;

  const cards = await supabaseRest(env, `mp_pipeline_opportunities?quote_id=eq.${quote.id}&select=id&limit=1`, {
    apiKey: serviceKey,
  });
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
      apiKey: serviceKey,
    });
  } else {
    await supabaseRest(env, "mp_pipeline_opportunities", {
      method: "POST",
      body: {
        user_id: quote.user_id,
        quote_id: quote.id,
        job_id: lead?.id ?? null,
        jobs_on_id: jobsOn.id,
        request_id: quote.request_id,
        client_id: quote.client_id,
        title: jobsOn.title || quote.number,
        stage: "jobs_on",
        deal_value: quote.total ?? 0,
      },
      prefer: "return=minimal",
      apiKey: serviceKey,
    }).catch(() => {});
  }

  return jobsOn;
}

export async function onRequestGet(context) {
  const serviceKey = context.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY" }, 500);
  }
  try {
    const quote = await loadQuote(context.env, context.params.token, serviceKey);
    if (!quote) return json({ error: "Quote not found" }, 404);
    const client = await loadClient(context.env, quote.client_id, serviceKey);
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
      client,
    });
  } catch (e) {
    return json({ error: e.message || "Failed to load quote" }, 500);
  }
}

export async function onRequestPost(context) {
  const env = context.env;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY — add in Cloudflare Pages settings." }, 500);
  }
  try {
    const token = context.params.token;
    const body = await context.request.json().catch(() => ({}));
    const action = body.action === "decline" ? "decline" : "approve";

    const quote = await loadQuote(env, token, serviceKey);
    if (!quote) return json({ error: "Quote not found" }, 404);
    if (quote.status === "declined") return json({ error: "Quote already declined" }, 400);

    if (action === "decline") {
      await supabaseRest(env, `mp_quotes?id=eq.${quote.id}`, {
        method: "PATCH",
        body: { status: "declined" },
        prefer: "return=minimal",
        apiKey: serviceKey,
      });
      return json({ ok: true, status: "declined" });
    }

    // Create Jobs On first — then mark quote approved (avoids approved-with-no-job if insert fails)
    const jobsOn = await ensureJobsOnForQuote(env, quote, serviceKey);

    if (quote.status !== "approved") {
      await rest(env, `mp_quotes?id=eq.${quote.id}`, serviceKey, {
        method: "PATCH",
        body: { status: "approved", approved_at: new Date().toISOString() },
        prefer: "return=minimal",
      });
    }

    return json({
      ok: true,
      status: "approved",
      jobs_on_id: jobsOn.id,
      number: jobsOn.number,
      already: quote.status === "approved",
    });
  } catch (e) {
    const msg = e.message || "Approval failed";
    const hint = /relation.*mp_jobs_on|column|schema cache/i.test(msg)
      ? `${msg} — run migration 014 in Supabase SQL editor.`
      : msg;
    return json({ error: hint }, 500);
  }
}
