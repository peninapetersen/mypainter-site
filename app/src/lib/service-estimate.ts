import type { LineItem } from "@/types/entities";
import type { MpService } from "@/types/services";

export type RoomMeasurement = {
  name?: string;
  length?: number | string;
  width?: number | string;
  height?: number | string;
  doors?: number | string;
  windows?: number | string;
};

export type RequestMeasurements = {
  rooms?: RoomMeasurement[];
  sqm?: number | string;
  notes?: string;
  location?: string;
  [key: string]: unknown;
};

export function calcRoomWallSqm(
  room: RoomMeasurement,
  deductions: { door_sqm?: number; window_sqm?: number } = {},
): number {
  const length = Number(room.length) || 0;
  const width = Number(room.width) || 0;
  const height = Number(room.height) || 2.4;
  const doors = Number(room.doors) || 0;
  const windows = Number(room.windows) || 0;
  const doorSqm = deductions.door_sqm ?? 1.8;
  const windowSqm = deductions.window_sqm ?? 1.2;
  const gross = 2 * (length + width) * height;
  return Math.max(0, gross - doors * doorSqm - windows * windowSqm);
}

export function calcEstimate(service: MpService, measurements: RequestMeasurements = {}) {
  const rate = Number(service.rate_per_unit) || 0;
  const minCharge = Number(service.min_charge) || 0;
  const schema = service.field_schema ?? {};

  if (service.measure_type === "room_walls") {
    const rooms = measurements.rooms ?? [];
    const deductions = (schema.deductions ?? {}) as { door_sqm?: number; window_sqm?: number };
    let totalSqm = 0;
    for (const room of rooms) totalSqm += calcRoomWallSqm(room, deductions);
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

export function summariseMeasurements(service: MpService, measurements: RequestMeasurements = {}): string {
  const parts: string[] = [];
  const schema = service.field_schema ?? {};

  if (service.measure_type === "room_walls") {
    const deductions = (schema.deductions ?? {}) as { door_sqm?: number; window_sqm?: number };
    (measurements.rooms ?? []).forEach((room, i) => {
      const sqm = calcRoomWallSqm(room, deductions);
      parts.push(
        `${room.name || `Room ${i + 1}`}: ${room.length ?? "?"}m × ${room.width ?? "?"}m × ${room.height ?? 2.4}m (${sqm.toFixed(1)} sqm walls)`,
      );
    });
  } else if (service.measure_type === "sqm") {
    if (measurements.sqm) parts.push(`${measurements.sqm} sqm`);
    for (const field of schema.fields ?? []) {
      if (field.key === "sqm") continue;
      const val = measurements[field.key];
      if (val !== undefined && val !== "" && val !== false) parts.push(`${field.label}: ${val}`);
    }
  } else {
    for (const field of schema.fields ?? []) {
      const val = measurements[field.key];
      if (val !== undefined && val !== "" && val !== false) parts.push(`${field.label}: ${val}`);
    }
  }

  if (measurements.notes) parts.push(String(measurements.notes));
  if (measurements.location) parts.push(`Location: ${measurements.location}`);
  return parts.join("\n");
}

export function buildLineItemsFromService(
  service: MpService,
  measurements: RequestMeasurements = {},
): LineItem[] {
  if (service.measure_type === "on_site" || !service.show_estimate) {
    return [
      {
        name: service.name,
        description: summariseMeasurements(service, measurements),
        qty: 1,
        unitPrice: 0,
      },
    ];
  }

  const { totalSqm, subtotal, raw, minApplied } = calcEstimate(service, measurements);
  const rate = Number(service.rate_per_unit) || 0;
  const items: LineItem[] = [];

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

export function formatNzMoney(amount: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
