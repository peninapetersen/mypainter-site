import { FormEvent, useCallback, useEffect, useState } from "react";
import { Kanban, RefreshCw, X } from "lucide-react";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { ClientSelect } from "@/components/forms/ClientSelect";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { formatCurrency } from "@/lib/nz";
import { createPipelineCard, listPipeline, syncPipelineFromEntities } from "@/lib/pipeline";
import type { PipelineOpportunity, PipelineStage } from "@/types/entities";

export function PipelinePage() {
  const { showError } = useErrorBanner();
  const { clients, map: clientNames } = useClientsMap();
  const [cards, setCards] = useState<PipelineOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [addStage, setAddStage] = useState<PipelineStage | null>(null);
  const [addForm, setAddForm] = useState({ title: "", client_id: "", deal_value: "", address: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await listPipeline();
      setCards(data);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loading && cards.length === 0 && !syncing) {
      sync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  async function sync() {
    setSyncing(true);
    try {
      const result = await syncPipelineFromEntities();
      await load();
      if (result.added > 0) {
        /* silent success — board updated */
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function onAddSubmit(e: FormEvent) {
    e.preventDefault();
    if (!addStage) return;
    setSaving(true);
    try {
      await createPipelineCard({
        title: addForm.title,
        stage: addStage,
        client_id: addForm.client_id || null,
        deal_value: parseFloat(addForm.deal_value) || 0,
        address: addForm.address,
      });
      setAddStage(null);
      setAddForm({ title: "", client_id: "", deal_value: "", address: "" });
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const totalValue = cards.reduce((s, c) => s + Number(c.deal_value), 0);
  const activeCount = cards.filter((c) => c.stage !== "paid" && c.stage !== "testimonial").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--mp-navy)]">
            <Kanban size={26} className="text-[var(--mp-orange)]" />
            Pipeline
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Leads → Quotes → Jobs On → Invoiced → Paid → Testimonials.{" "}
            <a href="/app/testimonials/list" className="font-semibold text-[var(--mp-orange)] hover:underline">
              All reviews →
            </a>
          </p>
        </div>
        <button
          type="button"
          onClick={sync}
          disabled={syncing}
          className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing…" : "Sync from app"}
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase text-slate-400">Active deals</p>
          <p className="text-2xl font-bold text-[var(--mp-navy)]">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase text-slate-400">Pipeline value</p>
          <p className="text-2xl font-bold text-[var(--mp-orange)]">{formatCurrency(totalValue)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase text-slate-400">Cards on board</p>
          <p className="text-2xl font-bold text-slate-800">{cards.length}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading pipeline…</p>
      ) : cards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="font-semibold text-slate-700">Your pipeline is empty</p>
          <p className="mt-1 text-sm text-slate-500">Sync existing requests, quotes, jobs, and invoices onto the board.</p>
          <button
            type="button"
            onClick={sync}
            className="mt-4 rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white"
          >
            Sync from app
          </button>
        </div>
      ) : (
        <PipelineBoard cards={cards} clientNames={clientNames} onRefresh={load} onAddCard={setAddStage} />
      )}

      {addStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={onAddSubmit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--mp-navy)]">Add to {addStage}</h2>
              <button type="button" onClick={() => setAddStage(null)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                required
                placeholder="Title"
                value={addForm.title}
                onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <ClientSelect
                clients={clients}
                value={addForm.client_id}
                onChange={(id) => setAddForm({ ...addForm, client_id: id })}
              />
              <input
                placeholder="Address"
                value={addForm.address}
                onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="Deal value ($)"
                value={addForm.deal_value}
                onChange={(e) => setAddForm({ ...addForm, deal_value: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setAddStage(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Add card"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
