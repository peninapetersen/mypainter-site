import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PipelineCard } from "@/components/pipeline/PipelineCard";
import { PIPELINE_STAGES } from "@/lib/pipeline-stages";
import { movePipelineCard } from "@/lib/pipeline";
import type { PipelineOpportunity, PipelineStage } from "@/types/entities";

export function PipelineBoard({
  cards,
  clientNames,
  onRefresh,
  onAddCard,
}: {
  cards: PipelineOpportunity[];
  clientNames: Map<string, string>;
  onRefresh: () => void;
  onAddCard: (stage: PipelineStage) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<PipelineStage | null>(null);

  const byStage = useMemo(() => {
    const map: Record<PipelineStage, PipelineOpportunity[]> = {
      job: [],
      quote: [],
      invoiced: [],
      paid: [],
      testimonial: [],
    };
    for (const c of cards) {
      if (map[c.stage]) map[c.stage].push(c);
    }
    for (const stage of PIPELINE_STAGES) {
      map[stage.id].sort((a, b) => a.sort_order - b.sort_order || b.updated_at.localeCompare(a.updated_at));
    }
    return map;
  }, [cards]);

  async function handleDrop(stage: PipelineStage, index: number) {
    if (!draggingId) return;
    try {
      await movePipelineCard(draggingId, stage, index);
      onRefresh();
    } catch {
      /* parent shows error */
    }
    setDraggingId(null);
    setOverStage(null);
  }

  return (
    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6">
      {PIPELINE_STAGES.map((col) => {
        const columnCards = byStage[col.id];
        const columnValue = columnCards.reduce((s, c) => s + Number(c.deal_value), 0);

        return (
          <div
            key={col.id}
            className="flex w-[min(100%,280px)] shrink-0 flex-col"
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(col.id);
            }}
            onDragLeave={() => setOverStage(null)}
          >
            <div className={`mb-2 rounded-t-lg ${col.headerBg} px-3 py-2 text-white`}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">{col.label}</h2>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">{columnCards.length}</span>
              </div>
              <p className="mt-0.5 text-[10px] text-white/80">{col.hint}</p>
            </div>

            <div
              className={`min-h-[420px] flex-1 rounded-b-xl rounded-tr-xl bg-slate-100/90 p-2 transition ${
                overStage === col.id ? "ring-2 ring-[var(--mp-orange)] ring-offset-2" : ""
              }`}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(col.id, columnCards.length);
              }}
            >
              <div className="space-y-2">
                {columnCards.map((card, idx) => (
                  <div
                    key={card.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDrop(col.id, idx);
                    }}
                  >
                    <PipelineCard
                      card={card}
                      clientName={card.client_id ? clientNames.get(card.client_id) ?? "" : ""}
                      accent={col.accent}
                      onDragStart={() => setDraggingId(card.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setOverStage(null);
                      }}
                    />
                  </div>
                ))}
              </div>

              {columnCards.length === 0 && (
                <p className="py-8 text-center text-xs text-slate-400">Drop cards here</p>
              )}

              <button
                type="button"
                onClick={() => onAddCard(col.id)}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-500 hover:border-[var(--mp-orange)] hover:text-[var(--mp-orange)]"
              >
                <Plus size={14} />
                Add card
              </button>

              {columnValue > 0 && (
                <p className="mt-2 text-center text-[10px] font-semibold text-slate-500">
                  ${columnValue.toLocaleString("en-NZ", { minimumFractionDigits: 0 })} in column
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
