import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListDeleteButton } from "@/components/ui/ListDeleteButton";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { formatDateLong } from "@/lib/nz";
import { deleteTestimonial, listTestimonials } from "@/lib/testimonials";
import { formatSupabaseError } from "@/lib/supabase-errors";
import type { Testimonial } from "@/types/entities";

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} className={n <= rating ? "fill-current" : "text-slate-200"} />
      ))}
    </span>
  );
}

export function TestimonialsListPage() {
  const { showError } = useErrorBanner();
  const [rows, setRows] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    listTestimonials()
      .then(setRows)
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [showError]);

  async function remove(row: Testimonial) {
    if (!confirm("Delete this testimonial?")) return;
    setDeletingId(row.id);
    try {
      await deleteTestimonial(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e) {
      showError(formatSupabaseError(e));
    } finally {
      setDeletingId(null);
    }
  }

  const avgRating = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0;

  return (
    <div>
      <PageHeader title="Testimonials" subtitle="Customer reviews collected after paid jobs." />

      {!loading && rows.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase text-slate-400">Total reviews</p>
            <p className="text-2xl font-bold text-[var(--mp-navy)]">{rows.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase text-slate-400">Average rating</p>
            <p className="flex items-center gap-2 text-2xl font-bold text-amber-600">
              {avgRating.toFixed(1)}
              <Star size={20} className="fill-amber-400 text-amber-400" />
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase text-slate-400">Pipeline</p>
            <Link to="/pipeline" className="text-sm font-semibold text-[var(--mp-orange)] hover:underline">
              View testimonial column →
            </Link>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          message="No testimonials yet. Mark an invoice paid, then send the customer a review link."
          actionLabel="View invoices"
          actionTo="/invoices/list"
        />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <article key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-[var(--mp-navy)]">{r.customer_name || "Customer"}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <StarRating rating={r.rating} />
                    <span>{formatDateLong(r.submitted_at)}</span>
                  </div>
                </div>
                <ListDeleteButton deleting={deletingId === r.id} onDelete={() => remove(r)} />
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{r.review_text}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                {r.invoice_id && (
                  <Link to={`/invoices/${r.invoice_id}`} className="text-[var(--mp-orange)] hover:underline">
                    Invoice →
                  </Link>
                )}
                {r.jobs_on_id && (
                  <Link to={`/jobs-on/${r.jobs_on_id}`} className="text-sky-700 hover:underline">
                    Jobs On →
                  </Link>
                )}
                {r.client_id && (
                  <Link to={`/clients/${r.client_id}`} className="text-slate-600 hover:underline">
                    Customer →
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
