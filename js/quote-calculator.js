(function () {
  const money = (n) =>
    new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD", maximumFractionDigits: 0 }).format(n || 0);

  function calcRoomWallSqm(room, deductions) {
    const length = Number(room.length) || 0;
    const width = Number(room.width) || 0;
    const height = Number(room.height) || 2.4;
    const doors = Number(room.doors) || 0;
    const windows = Number(room.windows) || 0;
    const doorSqm = Number(deductions?.door_sqm) || 1.8;
    const windowSqm = Number(deductions?.window_sqm) || 1.2;
    const gross = 2 * (length + width) * height;
    return Math.max(0, gross - doors * doorSqm - windows * windowSqm);
  }

  function calcEstimate(service, measurements) {
    const rate = Number(service.rate_per_unit) || 0;
    const minCharge = Number(service.min_charge) || 0;
    const schema = service.field_schema || {};

    if (service.measure_type === "room_walls") {
      const rooms = measurements.rooms || [];
      let totalSqm = 0;
      for (const room of rooms) totalSqm += calcRoomWallSqm(room, schema.deductions);
      totalSqm = Math.round(totalSqm * 10) / 10;
      const raw = totalSqm * rate;
      return { totalSqm, subtotal: Math.max(minCharge, raw), raw, minApplied: raw < minCharge && minCharge > 0 };
    }

    if (service.measure_type === "sqm") {
      const sqm = Number(measurements.sqm) || 0;
      const raw = sqm * rate;
      return { totalSqm: sqm, subtotal: Math.max(minCharge, raw), raw, minApplied: raw < minCharge && minCharge > 0 };
    }

    return { totalSqm: 0, subtotal: 0, raw: 0, minApplied: false };
  }

  const state = {
    step: 1,
    services: [],
    service: null,
    measurements: {},
    contact: { first_name: "", last_name: "", email: "", phone: "", location: "", notes: "" },
    loading: true,
    submitting: false,
    error: "",
  };

  const root = document.getElementById("quote-app");
  const stepsEl = document.getElementById("quote-steps");
  if (!root) return;

  const initialSlug = new URLSearchParams(window.location.search).get("service");

  async function loadServices() {
    const res = await fetch("/api/public/services");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load services");
    state.services = data.services || [];
    if (!state.services.length) {
      throw new Error("Could not load services. Call 027 295 2110 or use the contact form.");
    }
    if (initialSlug) {
      state.service = state.services.find((s) => s.slug === initialSlug) || null;
      if (state.service) state.step = 2;
    }
    initMeasurements();
    state.loading = false;
    render();
  }

  function initMeasurements() {
    if (!state.service) return;
    const schema = state.service.field_schema || {};
    if (state.service.measure_type === "room_walls") {
      const count = schema.rooms?.default || 1;
      const min = schema.rooms?.min || 1;
      const n = Math.max(min, count);
      state.measurements = {
        rooms: Array.from({ length: n }, (_, i) => defaultRoom(schema, i)),
      };
    } else {
      state.measurements = {};
      for (const field of schema.fields || []) {
        if (field.default !== undefined) state.measurements[field.key] = field.default;
      }
    }
  }

  function defaultRoom(schema, index) {
    const room = { name: "", length: "", width: "", height: "2.4", doors: "1", windows: "1" };
    for (const f of schema.room_fields || []) {
      if (f.default !== undefined) room[f.key] = String(f.default);
    }
    if (!room.name) room.name = index === 0 ? "Living room" : `Room ${index + 1}`;
    return room;
  }

  function setStep(n) {
    state.step = n;
    state.error = "";
    render();
    window.scrollTo({ top: root.offsetTop - 80, behavior: "smooth" });
  }

  function renderSteps() {
    const labels = ["Service", "Measurements", "Your details", "Review"];
    stepsEl.innerHTML = labels
      .map((label, i) => {
        const n = i + 1;
        let cls = "quote-step-pill";
        if (n === state.step) cls += " is-active";
        else if (n < state.step) cls += " is-done";
        return `<div class="${cls}">${n}. ${label}</div>`;
      })
      .join("");
  }

  function renderServiceStep() {
    return `
      <div class="quote-panel">
        <h2>What do you need?</h2>
        <p class="lead">Pick a service — we'll ask for measurements next and give you a ballpark estimate.</p>
        <div class="service-grid">
          ${state.services
            .map(
              (s) => `
            <button type="button" class="service-option ${state.service?.id === s.id ? "is-selected" : ""}" data-slug="${s.slug}">
              <strong>${escapeHtml(s.name)}</strong>
              <span>${escapeHtml(s.description)}</span>
              ${
                s.show_estimate && s.rate_per_unit > 0
                  ? `<em>From ${money(s.min_charge || s.rate_per_unit)} · ${money(s.rate_per_unit)}/${escapeHtml(s.unit_label)}</em>`
                  : `<em>Richo will quote on site</em>`
              }
            </button>`,
            )
            .join("")}
        </div>
        <div class="quote-actions">
          <button type="button" class="btn-primary" id="to-measurements" ${state.service ? "" : "disabled"}>Next →</button>
        </div>
      </div>`;
  }

  function renderRoomFields(service, room, index) {
    const schema = service.field_schema || {};
    const fields = schema.room_fields || [];
    return `
      <div class="room-card" data-room="${index}">
        <h3>${escapeHtml(room.name || `Room ${index + 1}`)}</h3>
        <div class="room-grid">
          ${fields
            .map((f) => {
              const val = room[f.key] ?? "";
              const req = f.required ? "required" : "";
              if (f.type === "number") {
                return `<div><label>${escapeHtml(f.label)}<input type="number" step="${f.step || 1}" min="${f.min ?? ""}" max="${f.max ?? ""}" data-room-field="${f.key}" data-room-index="${index}" value="${escapeAttr(val)}" ${req} /></label></div>`;
              }
              return `<div style="grid-column:1/-1"><label>${escapeHtml(f.label)}<input type="text" data-room-field="${f.key}" data-room-index="${index}" value="${escapeAttr(val)}" ${req} /></label></div>`;
            })
            .join("")}
        </div>
      </div>`;
  }

  function renderMeasurementsStep() {
    const s = state.service;
    if (!s) return "";
    const schema = s.field_schema || {};
    let fieldsHtml = "";

    if (s.measure_type === "room_walls") {
      const rooms = state.measurements.rooms || [];
      fieldsHtml = rooms.map((room, i) => renderRoomFields(s, room, i)).join("");
      const max = schema.rooms?.max || 10;
      if (rooms.length < max) {
        fieldsHtml += `<button type="button" class="btn-secondary" id="add-room" style="margin-top:1rem">+ Add another room</button>`;
      }
    } else {
      fieldsHtml = (schema.fields || [])
        .map((f) => {
          const val = state.measurements[f.key] ?? "";
          const req = f.required ? "required" : "";
          if (f.type === "textarea") {
            return `<label>${escapeHtml(f.label)}<textarea data-field="${f.key}" ${req}>${escapeHtml(String(val))}</textarea>${f.hint ? `<p class="hint">${escapeHtml(f.hint)}</p>` : ""}</label>`;
          }
          if (f.type === "select") {
            return `<label>${escapeHtml(f.label)}<select data-field="${f.key}" ${req}>${(f.options || [])
              .map((o) => `<option value="${escapeAttr(o)}" ${val === o ? "selected" : ""}>${escapeHtml(o)}</option>`)
              .join("")}</select></label>`;
          }
          if (f.type === "boolean") {
            return `<label><input type="checkbox" data-field="${f.key}" ${val ? "checked" : ""} /> ${escapeHtml(f.label)}</label>`;
          }
          return `<label>${escapeHtml(f.label)}<input type="${f.type === "number" ? "number" : "text"}" data-field="${f.key}" value="${escapeAttr(val)}" ${req} step="${f.step || 1}" min="${f.min ?? ""}" max="${f.max ?? ""}" />${f.hint ? `<p class="hint">${escapeHtml(f.hint)}</p>` : ""}</label>`;
        })
        .join("");
    }

    const est = calcEstimate(s, state.measurements);
    const estimateHtml =
      s.show_estimate && est.subtotal > 0
        ? `<div class="estimate-box"><p>Ballpark estimate</p><p class="amount">${money(est.subtotal)}</p><p class="fine">Guide only — Richo confirms on site. ${est.minApplied ? "Minimum charge applied." : ""}</p></div>`
        : `<div class="estimate-box"><p>On-site quote</p><p class="fine">Richo will assess the job and send a proper quote — no obligation.</p></div>`;

    return `
      <div class="quote-panel quote-form">
        <h2>Measurements</h2>
        <p class="lead">${escapeHtml(s.name)} — rough sizes are fine.</p>
        ${fieldsHtml}
        ${estimateHtml}
        <div class="quote-actions">
          <button type="button" class="btn-secondary" id="back-service">← Back</button>
          <button type="button" class="btn-primary" id="to-contact">Next →</button>
        </div>
      </div>`;
  }

  function renderContactStep() {
    const c = state.contact;
    return `
      <div class="quote-panel quote-form">
        <h2>Your details</h2>
        <p class="lead">Richo will get back to you — usually within a few hours.</p>
        <div class="room-grid">
          <label>First name<input type="text" id="contact-first-name" value="${escapeAttr(c.first_name)}" required autocomplete="given-name" /></label>
          <label>Last name<input type="text" id="contact-last-name" value="${escapeAttr(c.last_name)}" required autocomplete="family-name" /></label>
        </div>
        <label>Phone<input type="tel" id="contact-phone" value="${escapeAttr(c.phone)}" autocomplete="tel" /></label>
        <label>Email<input type="email" id="contact-email" value="${escapeAttr(c.email)}" autocomplete="email" /></label>
        <label>Job location<input type="text" id="contact-location" value="${escapeAttr(c.location)}" placeholder="e.g. Kamo, Whangarei" autocomplete="address-level2" /></label>
        <label>Anything else?<textarea id="contact-notes">${escapeHtml(c.notes)}</textarea></label>
        <p class="hint">Phone or email required.</p>
        ${state.error ? `<div class="quote-error">${escapeHtml(state.error)}</div>` : ""}
        <div class="quote-actions">
          <button type="button" class="btn-secondary" id="back-measurements">← Back</button>
          <button type="button" class="btn-primary" id="to-review">Next →</button>
        </div>
      </div>`;
  }

  function summariseForReview() {
    const s = state.service;
    const est = calcEstimate(s, state.measurements);
    let measureText = "";
    if (s.measure_type === "room_walls") {
      measureText = (state.measurements.rooms || [])
        .map((r, i) => {
          const sqm = calcRoomWallSqm(r, s.field_schema?.deductions);
          return `${r.name || `Room ${i + 1}`}: ${r.length}m × ${r.width}m × ${r.height || 2.4}m (~${sqm.toFixed(1)} sqm)`;
        })
        .join("\n");
    } else {
      measureText = Object.entries(state.measurements)
        .filter(([, v]) => v !== "" && v !== false)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
    }
    return { est, measureText };
  }

  function renderReviewStep() {
    const { est, measureText } = summariseForReview();
    const s = state.service;
    return `
      <div class="quote-panel">
        <h2>Review &amp; send</h2>
        <p class="lead">Check everything looks right, then send to Richo.</p>
        <p><strong>Service:</strong> ${escapeHtml(s.name)}</p>
        <div class="review-block">${escapeHtml(measureText)}</div>
        <p style="margin-top:1rem"><strong>Contact:</strong> ${escapeHtml([state.contact.first_name, state.contact.last_name].filter(Boolean).join(" "))} · ${escapeHtml(state.contact.phone || state.contact.email)}</p>
        ${state.contact.location ? `<p><strong>Location:</strong> ${escapeHtml(state.contact.location)}</p>` : ""}
        ${
          s.show_estimate && est.subtotal > 0
            ? `<div class="estimate-box"><p>Ballpark estimate</p><p class="amount">${money(est.subtotal)}</p></div>`
            : ""
        }
        ${state.error ? `<div class="quote-error">${escapeHtml(state.error)}</div>` : ""}
        <input type="text" name="_gotcha" id="gotcha" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true" />
        <div class="quote-actions">
          <button type="button" class="btn-secondary" id="back-contact">← Back</button>
          <button type="button" class="btn-primary" id="submit-quote" ${state.submitting ? "disabled" : ""}>${state.submitting ? "Sending…" : "Send request →"}</button>
        </div>
      </div>`;
  }

  function renderSuccess() {
    const s = state.service;
    const est = calcEstimate(s, state.measurements);
    return `
      <div class="quote-panel quote-success">
        <h2>✅ Request sent!</h2>
        <p>Richo has your job details${s.show_estimate && est.subtotal > 0 ? ` and ballpark of <strong>${money(est.subtotal)}</strong>` : ""}. He'll be in touch shortly.</p>
        <p>For urgent jobs, call <a href="tel:+64272952110">027 295 2110</a>.</p>
        <a href="/" class="btn-primary" style="display:inline-block;margin-top:1rem">Back to home</a>
      </div>`;
  }

  function render() {
    renderSteps();
    if (state.loading) {
      root.innerHTML = `<div class="quote-loading">Loading services…</div>`;
      return;
    }
    if (state.step === "done") {
      root.innerHTML = renderSuccess();
      return;
    }
    if (state.step === 1) root.innerHTML = renderServiceStep();
    else if (state.step === 2) root.innerHTML = renderMeasurementsStep();
    else if (state.step === 3) root.innerHTML = renderContactStep();
    else root.innerHTML = renderReviewStep();
    bindEvents();
  }

  function bindEvents() {
    root.querySelectorAll(".service-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.service = state.services.find((s) => s.slug === btn.dataset.slug) || null;
        initMeasurements();
        render();
      });
    });

    document.getElementById("to-measurements")?.addEventListener("click", () => state.service && setStep(2));
    document.getElementById("back-service")?.addEventListener("click", () => setStep(1));
    document.getElementById("to-contact")?.addEventListener("click", () => {
      if (!validateMeasurements()) return;
      setStep(3);
    });
    document.getElementById("back-measurements")?.addEventListener("click", () => setStep(2));
    document.getElementById("to-review")?.addEventListener("click", () => {
      readContactFields();
      if (!validateContact()) return;
      setStep(4);
    });
    document.getElementById("back-contact")?.addEventListener("click", () => setStep(3));
    document.getElementById("submit-quote")?.addEventListener("click", submitRequest);
    document.getElementById("add-room")?.addEventListener("click", () => {
      const schema = state.service.field_schema || {};
      state.measurements.rooms.push(defaultRoom(schema, state.measurements.rooms.length));
      render();
    });

    root.querySelectorAll("[data-room-field]").forEach((el) => {
      el.addEventListener("input", () => {
        const i = Number(el.dataset.roomIndex);
        const key = el.dataset.roomField;
        state.measurements.rooms[i][key] = el.value;
        updateEstimateBox();
      });
    });

    root.querySelectorAll("[data-field]").forEach((el) => {
      const event = el.type === "checkbox" ? "change" : "input";
      el.addEventListener(event, () => {
        const key = el.dataset.field;
        state.measurements[key] = el.type === "checkbox" ? el.checked : el.value;
        updateEstimateBox();
      });
    });
  }

  function updateEstimateBox() {
    const box = root.querySelector(".estimate-box");
    if (!box || !state.service?.show_estimate) return;
    const est = calcEstimate(state.service, state.measurements);
    if (est.subtotal > 0) {
      box.innerHTML = `<p>Ballpark estimate</p><p class="amount">${money(est.subtotal)}</p><p class="fine">Guide only — Richo confirms on site.${est.minApplied ? " Minimum charge applied." : ""}</p>`;
    }
  }

  function readContactFields() {
    const firstEl = root.querySelector("#contact-first-name");
    if (!firstEl) return;
    state.contact.first_name = firstEl.value.trim();
    state.contact.last_name = root.querySelector("#contact-last-name")?.value.trim() || "";
    state.contact.phone = root.querySelector("#contact-phone")?.value.trim() || "";
    state.contact.email = root.querySelector("#contact-email")?.value.trim() || "";
    state.contact.location = root.querySelector("#contact-location")?.value.trim() || "";
    state.contact.notes = root.querySelector("#contact-notes")?.value.trim() || "";
  }

  function validateMeasurements() {
    const s = state.service;
    if (s.measure_type === "room_walls") {
      for (const room of state.measurements.rooms || []) {
        if (!room.length || !room.width) {
          state.error = "Enter length and width for each room.";
          render();
          return false;
        }
      }
    }
    if (s.measure_type === "sqm" && !state.measurements.sqm) {
      state.error = "Enter the approximate area in square metres.";
      render();
      return false;
    }
    state.error = "";
    return true;
  }

  function validateContact() {
    const firstName = String(state.contact.first_name || "").trim();
    const lastName = String(state.contact.last_name || "").trim();
    const email = String(state.contact.email || "").trim();
    const phone = String(state.contact.phone || "").trim();

    if (!firstName) {
      state.error = "Please enter your first name.";
      render();
      return false;
    }
    if (!lastName) {
      state.error = "Please enter your last name.";
      render();
      return false;
    }
    if (!email && !phone) {
      state.error = "Please enter a phone number or email so Richo can reply.";
      render();
      return false;
    }
    state.error = "";
    return true;
  }

  async function submitRequest() {
    // Contact was saved on step 3 — do not re-read DOM on review (it clears the name)
    if (state.step === 3) readContactFields();
    if (!validateContact()) return;

    const contact = {
      first_name: String(state.contact.first_name || "").trim(),
      last_name: String(state.contact.last_name || "").trim(),
      name: [state.contact.first_name, state.contact.last_name].filter(Boolean).join(" ").trim(),
      email: String(state.contact.email || "").trim(),
      phone: String(state.contact.phone || "").trim(),
      location: String(state.contact.location || "").trim(),
      notes: String(state.contact.notes || "").trim(),
    };

    state.submitting = true;
    state.error = "";
    render();

    try {
      const res = await fetch("/api/public/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          service_slug: state.service.slug,
          measurements: { ...state.measurements, notes: contact.notes },
          first_name: contact.first_name,
          last_name: contact.last_name,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          location: contact.location,
          notes: contact.notes,
          _gotcha: root.querySelector("#gotcha")?.value || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send request");
      state.step = "done";
      state.submitting = false;
      render();
    } catch (e) {
      state.submitting = false;
      state.error = e.message || "Something went wrong. Call Richo on 027 295 2110.";
      render();
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  loadServices().catch((e) => {
    state.loading = false;
    root.innerHTML = `<div class="quote-error">${escapeHtml(e.message)}. Try again or call <a href="tel:+64272952110">027 295 2110</a>.</div>`;
  });
})();
