import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, MapPin, User } from "lucide-react";
import { formatCurrency } from "@/lib/nz";
import { pipelineCardHref } from "@/lib/pipeline";
import type { PipelineOpportunity } from "@/types/entities";

export function PipelineCard({
  card,
  clientName,
  accent,
  onDragStart,
  onDragEnd,
}: {
  card: PipelineOpportunity;
  clientName: string;
  accent: string;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const navigate = useNavigate();
  const dragged = useRef(false);
  const href = pipelineCardHref(card);

  return (
    <div
      draggable
      onDragStart={(e) => {
        dragged.current = true;
        e.dataTransfer.setData("text/plain", card.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={() => {
        onDragEnd();
        setTimeout(() => {
          dragged.current = false;
        }, 0);
      }}
      onClick={() => {
        if (!dragged.current && href) navigate(href);
      }}
      className={`group cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md active:cursor-grabbing border-l-4 ${accent} ${href ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-[var(--mp-navy)] leading-snug">{card.title || "Untitled"}</p>
        {href && (
          <ExternalLink size={14} className="shrink-0 text-slate-300 group-hover:text-[var(--mp-orange)]" />
        )}
      </div>
      {clientName && (
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
          <User size={12} className="shrink-0" />
          {clientName}
        </p>
      )}
      {card.address && (
        <p className="mt-1 flex items-start gap-1 text-xs text-slate-500">
          <MapPin size={12} className="mt-0.5 shrink-0" />
          <span className="line-clamp-2">{card.address}</span>
        </p>
      )}
      {Number(card.deal_value) > 0 && (
        <p className="mt-2 text-sm font-bold text-[var(--mp-orange)]">{formatCurrency(card.deal_value)}</p>
      )}
      {card.stage === "testimonial" && card.testimonial_requested && !card.testimonial_received && (
        <span className="mt-2 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
          Review requested
        </span>
      )}
    </div>
  );
}
