export function rowToQuote(row) {
  if (!row) return null;
  let lineItems = [];
  try {
    lineItems = JSON.parse(row.line_items || "[]");
  } catch {
    lineItems = [];
  }
  return {
    id: row.id,
    number: row.number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    quoteDate: row.quote_date,
    validUntil: row.valid_until,
    clientName: row.client_name,
    clientAddress: row.client_address,
    clientPhone: row.client_phone,
    clientEmail: row.client_email,
    jobAddress: row.job_address,
    scope: row.scope,
    exclusions: row.exclusions,
    lineItems,
    totalCents: row.total_cents,
    depositCents: row.deposit_cents,
    gstRegistered: !!row.gst_registered,
    status: row.status,
    notes: row.notes,
  };
}

export function calcTotals(lineItems) {
  const items = Array.isArray(lineItems) ? lineItems : [];
  let total = 0;
  const normalized = items.map((it) => {
    const qty = Number(it.qty) || 0;
    const unitCents = Math.round(Number(it.unitPrice) * 100) || 0;
    const lineCents = Math.round(qty * unitCents);
    total += lineCents;
    return {
      description: String(it.description || "").trim(),
      qty,
      unitPrice: unitCents / 100,
      lineTotal: lineCents / 100,
    };
  });
  return { lineItems: normalized, totalCents: total };
}

export function formatMoney(cents) {
  const n = (Number(cents) || 0) / 100;
  return n.toLocaleString("en-NZ", { style: "currency", currency: "NZD" });
}

export function formatDateNZ(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate + (isoDate.length === 10 ? "T12:00:00" : ""));
  if (Number.isNaN(d.getTime())) return isoDate;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}.${mm}.'${yy}`;
}

export async function nextQuoteNumber(db) {
  await db.prepare("UPDATE quote_seq SET next_num = next_num + 1 WHERE id = 1").run();
  const row = await db.prepare("SELECT next_num FROM quote_seq WHERE id = 1").first();
  // After increment, next_num is the *next* available; current used is next_num - 1
  const used = (row?.next_num ?? 132) - 1;
  return `MP-${used}`;
}

export function uid() {
  return crypto.randomUUID();
}

export const FROM_DEFAULTS = {
  name: "Richard Petersen",
  phone: "027 295 2110",
  email: "mypaintermate@gmail.com",
  business: "mypainter.co.nz",
};
