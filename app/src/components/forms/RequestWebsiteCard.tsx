import { formatNzMoney } from "@/lib/service-estimate";
import type { RequestMeasurements } from "@/lib/service-estimate";
import type { MpService } from "@/types/services";

type Props = {
  service: MpService | null;
  measurements: RequestMeasurements;
  estimateSubtotal: number;
  source: string;
};

export function RequestWebsiteCard({ service, measurements, estimateSubtotal, source }: Props) {
  if (source !== "website" && !service && !Object.keys(measurements).length) return null;

  return (
    <section className="rounded-lg border border-orange-200 bg-orange-50/60 p-4">
      <h2 className="text-lg font-bold text-[var(--mp-navy)]">Website enquiry</h2>
      {service && (
        <p className="mt-1 text-sm text-slate-600">
          Service: <span className="font-semibold text-slate-800">{service.name}</span>
        </p>
      )}
      {source === "website" && (
        <p className="mt-1 text-xs uppercase tracking-wide text-orange-700">Submitted from mypainter.co.nz</p>
      )}
      {estimateSubtotal > 0 && (
        <p className="mt-2 text-sm text-slate-700">
          Ballpark estimate: <span className="font-bold text-[var(--mp-navy)]">{formatNzMoney(estimateSubtotal)}</span>
        </p>
      )}
      {measurements.rooms && measurements.rooms.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-slate-700">
          {measurements.rooms.map((room, i) => (
            <li key={i}>
              {room.name || `Room ${i + 1}`}: {room.length}m × {room.width}m × {room.height ?? 2.4}m
            </li>
          ))}
        </ul>
      )}
      {measurements.sqm && (
        <p className="mt-2 text-sm text-slate-700">Area: {measurements.sqm} sqm</p>
      )}
      {measurements.location && (
        <p className="mt-2 text-sm text-slate-600">Location: {String(measurements.location)}</p>
      )}
    </section>
  );
}
