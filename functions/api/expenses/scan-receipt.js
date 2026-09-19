const RECEIPT_PROMPT = `You read NZ business receipts and invoices for a painter (MyPainter, Auckland NZ).
Return ONLY valid JSON with these keys:
{
  "item_name": "short title for the main purchase",
  "description": "1-2 sentence summary of line items",
  "amount": number (total paid in NZD, including GST if shown),
  "gst_amount": number (GST component if visible, else estimate 3/23 of total if GST inclusive),
  "gst_inclusive": boolean,
  "expense_date": "YYYY-MM-DD",
  "merchant": "store or supplier name",
  "category": one of "COGS_Materials" | "Motor_Vehicle" | "Tools_Equipment" | "Subcontractors" | "Admin_Insurance",
  "accounting_code": "best guess chart code or empty string",
  "reimburse_to": "Not reimbursable"
}
Use NZ spelling. If date missing use today. Category: paint/supplies/hardware=COGS_Materials, fuel/parking=Motor_Vehicle, tools=Tools_Equipment.`;

async function verifySupabaseUser(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://jkampxliebnzsevvmqre.supabase.co";
  const anon = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  if (!anon) return null;
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anon },
  });
  if (!res.ok) return null;
  return res.json();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const VALID_CATEGORIES = new Set([
  "COGS_Materials",
  "Motor_Vehicle",
  "Tools_Equipment",
  "Subcontractors",
  "Admin_Insurance",
]);

function normaliseScan(raw) {
  const amount = Math.round((Number(raw.amount) || 0) * 100) / 100;
  const gst_amount = Math.round((Number(raw.gst_amount) || 0) * 100) / 100;
  const category = VALID_CATEGORIES.has(raw.category) ? raw.category : "COGS_Materials";
  let expense_date = String(raw.expense_date || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expense_date)) {
    expense_date = new Date().toISOString().slice(0, 10);
  }
  return {
    item_name: String(raw.item_name || raw.merchant || "Receipt").slice(0, 200),
    description: String(raw.description || "").slice(0, 2000),
    amount,
    gst_amount,
    gst_inclusive: raw.gst_inclusive !== false,
    expense_date,
    merchant: String(raw.merchant || "").slice(0, 200),
    category,
    accounting_code: String(raw.accounting_code || "").slice(0, 80),
    reimburse_to: String(raw.reimburse_to || "Not reimbursable").slice(0, 120),
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = await verifySupabaseUser(request, env);
  if (!user?.id) return json({ error: "Unauthorized" }, 401);

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return json({ error: "Receipt AI not configured — add OPENAI_API_KEY to Cloudflare Pages secrets." }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { imageBase64, mimeType = "image/jpeg" } = body;
  if (!imageBase64 || typeof imageBase64 !== "string") {
    return json({ error: "imageBase64 required" }, 400);
  }

  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: RECEIPT_PROMPT },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
      }),
    });

    const aiJson = await aiRes.json();
    if (!aiRes.ok) {
      const msg = aiJson.error?.message || "OpenAI request failed";
      return json({ error: msg }, 502);
    }

    const content = aiJson.choices?.[0]?.message?.content;
    if (!content) return json({ error: "Empty AI response" }, 502);

    const parsed = JSON.parse(content);
    const scan = normaliseScan(parsed);
    return json({ scan, raw: { ...parsed, model: "gpt-4o-mini", scanned_at: new Date().toISOString() } });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Scan failed" }, 500);
  }
}
