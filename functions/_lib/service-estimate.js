/** @typedef {{ slug: string; name: string; measure_type: string; rate_per_unit: number; min_charge: number; unit_label: string; field_schema?: Record<string, unknown>; show_estimate?: boolean }} MpService */

/**
 * @param {{ length?: number; width?: number; height?: number; doors?: number; windows?: number }} room
 * @param {{ door_sqm?: number; window_sqm?: number }} deductions
 */
export function calcRoomWallSqm(room, deductions = {}) {
  const length = Number(room.length) || 0;
  const width = Number(room.width) || 0;
  const height = Number(room.height) || 2.4;
  const doors = Number(room.doors) || 0;
  const windows = Number(room.windows) || 0;
  const doorSqm = Number(deductions.door_sqm) || 1.8;
  const windowSqm = Number(deductions.window_sqm) || 1.2;
  const gross = 2 * (length + width) * height;
  return Math.max(0, gross - doors * doorSqm - windows * windowSqm);
}

/**
 * @param {MpService} service
 * @param {Record<string, unknown>} measurements
 */
export function calcEstimate(service, measurements = {}) {
  const rate = Number(service.rate_per_unit) || 0;
  const minCharge = Number(service.min_charge) || 0;
  const schema = service.field_schema || {};

  if (service.measure_type === "room_walls") {
    const rooms = /** @type {Record<string, unknown>[]} */ (measurements.rooms || []);
    const deductions = /** @type {{ door_sqm?: number; window_sqm?: number }} */ (schema.deductions || {});
    let totalSqm = 0;
    for (const room of rooms) {
      totalSqm += calcRoomWallSqm(room, deductions);
    }
    totalSqm = Math.round(totalSqm * 10) / 10;
    const raw = totalSqm * rate;
    const subtotal = Math.max(minCharge, raw);
    return { totalSqm, subtotal, raw, minApplied: raw < minCharge && minCharge > 0 };
  }

  if (service.measure_type === "sqm") {
    const sqm = Number(measurements.sqm) || 0;
    const raw = sqm * rate;
    const subtotal = Math.max(minCharge, raw);
    return { totalSqm: sqm, subtotal, raw, minApplied: raw < minCharge && minCharge > 0 };
  }

  return { totalSqm: 0, subtotal: 0, raw: 0, minApplied: false };
}

/**
 * @param {MpService} service
 * @param {Record<string, unknown>} measurements
 */
export function buildLineItems(service, measurements = {}) {
  if (service.measure_type === "on_site" || !service.show_estimate) {
    return [{ name: service.name, description: summariseMeasurements(service, measurements), qty: 1, unitPrice: 0 }];
  }

  const { totalSqm, subtotal, raw, minApplied } = calcEstimate(service, measurements);
  const rate = Number(service.rate_per_unit) || 0;
  const items = [];

  if (totalSqm > 0 && rate > 0) {
    items.push({
      name: service.name,
      description: summariseMeasurements(service, measurements),
      qty: totalSqm,
      unitPrice: rate,
    });
  } else {
    items.push({
      name: service.name,
      description: summariseMeasurements(service, measurements),
      qty: 1,
      unitPrice: subtotal,
    });
  }

  if (minApplied && subtotal > raw) {
    items.push({
      name: "Minimum charge",
      description: `Minimum job charge applies (estimate was $${Math.round(raw).toLocaleString("en-NZ")})`,
      qty: 1,
      unitPrice: subtotal - raw,
    });
  }

  return items;
}

/**
 * @param {MpService} service
 * @param {Record<string, unknown>} measurements
 */
export function summariseMeasurements(service, measurements = {}) {
  const parts = [];

  if (service.measure_type === "room_walls") {
    const rooms = /** @type {Record<string, unknown>[]} */ (measurements.rooms || []);
    const schema = service.field_schema || {};
    const deductions = /** @type {{ door_sqm?: number; window_sqm?: number }} */ (schema.deductions || {});
    rooms.forEach((room, i) => {
      const sqm = calcRoomWallSqm(room, deductions);
      const label = String(room.name || `Room ${i + 1}`);
      parts.push(
        `${label}: ${room.length || "?"}m × ${room.width || "?"}m × ${room.height || 2.4}m (${sqm.toFixed(1)} sqm walls)`,
      );
    });
  } else if (service.measure_type === "sqm") {
    if (measurements.sqm) parts.push(`${measurements.sqm} sqm`);
    const fields = /** @type {Record<string, unknown>[]} */ ((service.field_schema || {}).fields || []);
    for (const field of fields) {
      if (field.key === "sqm") continue;
      const val = measurements[field.key];
      if (val !== undefined && val !== "" && val !== false) {
        parts.push(`${field.label}: ${val}`);
      }
    }
  } else {
    const fields = /** @type {Record<string, unknown>[]} */ ((service.field_schema || {}).fields || []);
    for (const field of fields) {
      const val = measurements[field.key];
      if (val !== undefined && val !== "" && val !== false) {
        parts.push(`${field.label}: ${val}`);
      }
    }
  }

  if (measurements.notes) parts.push(String(measurements.notes));
  if (measurements.location) parts.push(`Location: ${measurements.location}`);

  return parts.join("\n");
}

/** @param {number} amount */
export function formatNzMoney(amount) {
  return new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD", maximumFractionDigits: 0 }).format(
    amount || 0,
  );
}
