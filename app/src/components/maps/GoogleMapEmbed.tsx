import { ExternalLink, MapPin } from "lucide-react";
import { googleMapsDirectionsUrl, googleMapsEmbedUrl, googleMapsSearchUrl } from "@/lib/site-address";

export function GoogleMapEmbed({ address }: { address: string }) {
  const trimmed = address.trim();
  if (!trimmed) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-start gap-2">
          <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--mp-orange)]" />
          <p className="text-sm font-semibold text-[var(--mp-navy)]">{trimmed}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={googleMapsDirectionsUrl(trimmed)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--mp-navy)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
          >
            Directions
            <ExternalLink size={12} />
          </a>
          <a
            href={googleMapsSearchUrl(trimmed)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Open in Maps
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
      <iframe
        title={`Map: ${trimmed}`}
        src={googleMapsEmbedUrl(trimmed)}
        className="h-56 w-full border-0 sm:h-72"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
