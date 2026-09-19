export const FROM = {
  name: "Richard Petersen",
  phone: "027 295 2110",
  email: "mypaintermate@gmail.com",
};

export function money(cents) {
  return ((Number(cents) || 0) / 100).toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
  });
}

export function formatDateNZ(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate.length === 10 ? isoDate + "T12:00:00" : isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}.${mm}.'${yy}`;
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scopeHtml(scope) {
  const parts = String(scope || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return "<p></p>";
  return parts.map((p) => `<p>${esc(p).replace(/\n/g, "<br/>")}</p>`).join("");
}

export function renderQuoteSheet(quote) {
  const lines = Array.isArray(quote.lineItems) ? quote.lineItems : [];
  const linesHtml = lines.length
    ? lines
        .map(
          (li) => `
      <div class="quote-line">
        <div class="desc">${esc(li.description)}${li.qty && li.qty !== 1 ? ` <span style="color:#777">× ${esc(li.qty)}</span>` : ""}</div>
        <div class="amt">${money(Math.round((li.lineTotal ?? li.unitPrice * li.qty) * 100))}</div>
      </div>`,
        )
        .join("")
    : `<div class="quote-line"><div class="desc">Painting works as scoped</div><div class="amt">${money(quote.totalCents)}</div></div>`;

  const job = quote.jobAddress || quote.clientAddress;
  return `
  <article class="quote-sheet" id="quote-sheet">
    <div class="quote-top">
      <img class="quote-logo" src="/images/logo.png" alt="mypainter.co.nz" />
      <div class="quote-meta">
        <div class="num">Quote: ${esc(quote.number || "—")}</div>
        <div>Date: ${formatDateNZ(quote.quoteDate)}</div>
        <div>Valid: ${formatDateNZ(quote.validUntil)}</div>
      </div>
    </div>
    <div class="quote-parties">
      <div class="quote-party">
        <h3>To</h3>
        <p><strong>${esc(quote.clientName)}</strong></p>
        <p>${esc(job).replace(/\n/g, "<br/>")}</p>
        ${quote.clientPhone ? `<p>${esc(quote.clientPhone)}</p>` : ""}
        ${quote.clientEmail ? `<p>${esc(quote.clientEmail)}</p>` : ""}
      </div>
      <div class="quote-party">
        <h3>From</h3>
        <p><strong>${esc(FROM.name)}</strong></p>
        <p>${esc(FROM.phone)}</p>
        <p>${esc(FROM.email)}</p>
        <p>mypainter.co.nz</p>
      </div>
    </div>
    <h1 class="quote-title">Quotation</h1>
    <section class="quote-section">
      <h2>Scope of work</h2>
      <div class="quote-scope">${scopeHtml(quote.scope)}</div>
    </section>
    ${
      quote.exclusions
        ? `<section class="quote-section"><h2>Exclusions</h2><div class="quote-scope">${scopeHtml(quote.exclusions)}</div></section>`
        : ""
    }
    <section class="quote-section">
      <h2>Pricing</h2>
      <div class="quote-lines">${linesHtml}</div>
      <div class="quote-totals">
        <div class="row grand"><span>Total Price</span><span>${money(quote.totalCents)}</span></div>
        <div class="row"><span>Deposit</span><span>${money(quote.depositCents)}</span></div>
        <div class="row"><span>Balance</span><span>${money((quote.totalCents || 0) - (quote.depositCents || 0))}</span></div>
        <p class="quote-note">${quote.gstRegistered ? "Price includes GST." : "Not registered for GST."}</p>
      </div>
    </section>
    <footer class="quote-footer">
      All work will be of a very high standard. Quote valid until ${formatDateNZ(quote.validUntil)}.
    </footer>
  </article>`;
}
