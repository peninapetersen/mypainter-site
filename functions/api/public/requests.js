import { json } from "../../_lib/auth.js";
import { buildLineItems, calcEstimate, summariseMeasurements } from "../../_lib/service-estimate.js";
import { getDefaultBySlug } from "../../_lib/default-services.js";
import { ensureServicesSeeded, getOwnerUserId, supabaseRest } from "../../_lib/supabase-admin.js";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function splitName(full) {
  const parts = String(full || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return { first_name: "", last_name: "", name: "" };
  if (parts.length === 1) return { first_name: parts[0], last_name: "", name: parts[0] };
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
    name: parts.join(" "),
  };
}

async function findOrCreateClient(env, userId, input) {
  const email = String(input.email || "")
    .trim()
    .toLowerCase();
  const phone = String(input.phone || "").trim();
  const split = splitName(input.name);
  const first_name = String(input.first_name || split.first_name || "").trim();
  const last_name = String(input.last_name || split.last_name || "").trim();
  const name = [first_name, last_name].filter(Boolean).join(" ").trim() || split.name;
  const address = String(input.address || input.location || "").trim();

  if (email) {
    const existing = await supabaseRest(
      env,
      `mp_clients?user_id=eq.${userId}&email=eq.${encodeURIComponent(email)}&select=id&limit=1`,
    );
    if (existing?.[0]?.id) {
      await supabaseRest(env, `mp_clients?id=eq.${existing[0].id}`, {
        method: "PATCH",
        body: {
          name: name || undefined,
          first_name,
          last_name,
          phone: phone || undefined,
          address: address || undefined,
          last_activity_at: new Date().toISOString(),
        },
        prefer: "return=minimal",
      });
      return existing[0].id;
    }
  }

  const created = await supabaseRest(env, "mp_clients", {
    method: "POST",
    body: {
      user_id: userId,
      name,
      first_name,
      last_name,
      email,
      phone,
      address,
      status: "lead",
      lead_source: "website",
      last_activity_at: new Date().toISOString(),
    },
    prefer: "return=representation",
  });
  return created?.[0]?.id ?? created?.id;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return json(
      { error: "Server missing SUPABASE_SERVICE_ROLE_KEY — add it in Cloudflare Pages settings." },
      503,
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (body._gotcha) return json({ ok: true, id: "spam-filtered" });

  const slug = String(body.service_slug || "").trim();
  const first_name = String(body.first_name || "").trim();
  const last_name = String(body.last_name || "").trim();
  const name = String(body.name || [first_name, last_name].filter(Boolean).join(" ")).trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();

  if (!slug) return json({ error: "Pick a service" }, 400);
  if (!first_name && !name) return json({ error: "First name is required" }, 400);
  if (!email && !phone) return json({ error: "Email or phone is required" }, 400);

  try {
    const userId = await getOwnerUserId(env);
    if (!userId) {
      return json(
        { error: "App not set up yet — sign in at mypainter.co.nz/app once, then try again." },
        503,
      );
    }

    await ensureServicesSeeded(env);

    let service = null;
    const services = await supabaseRest(
      env,
      `mp_services?user_id=eq.${userId}&slug=eq.${encodeURIComponent(slug)}&active=eq.true&select=*&limit=1`,
    );
    service = services?.[0] ?? null;
    if (!service) {
      service = getDefaultBySlug(slug);
    }
    if (!service) return json({ error: "Unknown service" }, 400);

    const measurements = {
      ...(body.measurements && typeof body.measurements === "object" ? body.measurements : {}),
      location: String(body.location || body.address || "").trim(),
      notes: String(body.notes || "").trim(),
    };

    const estimate = calcEstimate(service, measurements);
    const lineItems = buildLineItems(service, measurements);
    const subtotal = estimate.subtotal;
    const serviceDetails = summariseMeasurements(service, measurements);
    const clientId = await findOrCreateClient(env, userId, body);

    const title = `${service.name}${measurements.location ? ` — ${measurements.location}` : ""}`;

    const created = await supabaseRest(env, "mp_requests", {
      method: "POST",
      body: {
        user_id: userId,
        client_id: clientId,
        service_id: service.id ?? null,
        title,
        requested_on: todayIso(),
        service_details: serviceDetails,
        measurements,
        estimate_subtotal: subtotal,
        source: "website",
        line_items: lineItems,
        subtotal,
        status: "open",
        internal_notes: `Website quote request from ${name}${email ? ` (${email})` : ""}${phone ? ` · ${phone}` : ""}`,
      },
      prefer: "return=representation",
    });

    const row = created?.[0] ?? created;

    return json({
      ok: true,
      id: row?.id,
      estimate_subtotal: subtotal,
      show_estimate: service.show_estimate,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Could not save request" }, 500);
  }
}
