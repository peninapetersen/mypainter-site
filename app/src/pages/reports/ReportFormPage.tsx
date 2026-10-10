import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Eye, ImagePlus, Mail, Plus, Trash2, X } from "lucide-react";
import { DocumentPreviewModal } from "@/components/documents/DocumentPreviewModal";
import { ReportDocument } from "@/components/documents/ReportDocument";
import { ClientSelect } from "@/components/forms/ClientSelect";
import { FormSaveBar } from "@/components/ui/FormSaveBar";
import { RequestNotesCard } from "@/components/forms/RequestNotesCard";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { clientDisplayName } from "@/lib/client-display";
import { documentProfileFromSettings } from "@/lib/document-profile";
import { todayIsoDate } from "@/lib/line-items";
import { openReportGmail, reportEmailBody } from "@/lib/report-email";
import {
  createReport,
  deleteReport,
  ensureReportViewLink,
  getReport,
  newArea,
  peekReportNumber,
  removeReportPhoto,
  reportPhotoUrl,
  sendReportToCustomer,
  updateReport,
  uploadReportPhoto,
} from "@/lib/reports";
import { formatSupabaseError } from "@/lib/supabase-errors";
import { getWorkSettings } from "@/lib/work-settings";
import type { ReportArea } from "@/types/entities";

const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

const emptyForm = {
  client_id: "",
  title: "",
  report_date: todayIsoDate(),
  site_address: "",
  summary: "",
  areas: [] as ReportArea[],
  recommendations: "",
  internal_notes: "",
};
/** A copy of the report kept in this browser while it is being written, so a failed save can never lose the work. */
const backupKey = (id: string) => `mp-report-backup-${id}`;
function readBackup(id: string): { at: string; form: typeof emptyForm } | null {
  try {
    const raw = localStorage.getItem(backupKey(id));
    return raw ? (JSON.parse(raw) as { at: string; form: typeof emptyForm }) : null;
  } catch {
    return null;
  }
}

export function ReportFormPage() {
  const { id: routeId } = useParams();
  const [search] = useSearchParams();
  const isNew = !routeId || routeId === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const { clients } = useClientsMap();
  // New reports pick their id up front so photos can be filed under it before the first save.
  const draftId = useRef(crypto.randomUUID());
  const reportId = isNew ? draftId.current : (routeId as string);
  const savedOnce = useRef(!isNew);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [number, setNumber] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [viewUrl, setViewUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "sent">("draft");
  const [docProfile, setDocProfile] = useState(() => documentProfileFromSettings(null));
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [dirty, setDirty] = useState(false);
  const [restore, setRestore] = useState<{ at: string; form: typeof emptyForm } | null>(null);
  const [form, setForm] = useState({ ...emptyForm, areas: [newArea()] });

  useEffect(() => {
    getWorkSettings().then((ws) => setDocProfile(documentProfileFromSettings(ws))).catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      try {
        if (isNew) {
          setNumber(await peekReportNumber());
          const preClient = search.get("client");
          if (preClient) setForm((f) => ({ ...f, client_id: preClient }));
          const saved = readBackup("new");
          if (saved && (saved.form.summary?.trim() || saved.form.title?.trim() || saved.form.areas?.some((a) => a.finding || a.area))) setRestore(saved);
          return;
        }
        const r = await getReport(routeId as string);
        if (!r) {
          showError("Report not found");
          navigate("/reports/list");
          return;
        }
        setNumber(r.number);
        setStatus(r.status);
        if (r.view_token) setViewUrl(`${window.location.origin}/report-view.html?token=${r.view_token}`);
        setForm({
          client_id: r.client_id ?? "",
          title: r.title,
          report_date: r.report_date ?? todayIsoDate(),
          site_address: r.site_address,
          summary: r.summary,
          areas: r.areas?.length ? r.areas : [newArea()],
          recommendations: r.recommendations,
          internal_notes: r.internal_notes,
        });
        const saved = readBackup(r.id);
        if (saved && new Date(saved.at).getTime() > new Date(r.updated_at).getTime() + 2000) setRestore(saved);
      } catch (e) {
        showError(formatSupabaseError(e));
      } finally {
        setLoading(false);
      }
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  // Show thumbnails: sign each stored photo once.
  useEffect(() => {
    const need = form.areas.flatMap((a) => a.photos).filter((p) => !photoUrls[p]);
    if (!need.length) return;
    let alive = true;
    Promise.all(need.map((p) => reportPhotoUrl(p).then((u) => [p, u] as const).catch(() => null))).then((pairs) => {
      if (!alive) return;
      const add: Record<string, string> = {};
      for (const pr of pairs) if (pr) add[pr[0]] = pr[1];
      if (Object.keys(add).length) setPhotoUrls((prev) => ({ ...prev, ...add }));
    });
    return () => {
      alive = false;
    };
  }, [form.areas, photoUrls]);

  function setArea(areaId: string, patch: Partial<ReportArea>) {
    change((f) => ({ ...f, areas: f.areas.map((a) => (a.id === areaId ? { ...a, ...patch } : a)) }));
  }

  async function addPhotos(areaId: string, files: FileList | null) {
    if (!files?.length) return;
    try {
      const paths: string[] = [];
      for (const file of Array.from(files)) paths.push(await uploadReportPhoto(file, reportId));
      change((f) => ({
        ...f,
        areas: f.areas.map((a) => (a.id === areaId ? { ...a, photos: [...a.photos, ...paths] } : a)),
      }));
    } catch (e) {
      showError(formatSupabaseError(e));
    }
  }

  async function dropPhoto(areaId: string, path: string) {
    setArea(areaId, { photos: form.areas.find((a) => a.id === areaId)?.photos.filter((p) => p !== path) ?? [] });
    void removeReportPhoto(path);
  }

  function change(next: typeof form | ((f: typeof form) => typeof form)) {
    setDirty(true);
    setForm(next);
  }

  // Keep a copy in this browser as the report is written.
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(backupKey(savedOnce.current ? reportId : "new"), JSON.stringify({ at: new Date().toISOString(), form }));
      } catch {
        /* storage full or blocked: saving to the database still works */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [form, dirty, reportId]);

  // Warn before closing the tab with unsaved writing.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function persist(): Promise<string | null> {
    setSaveError("");
    setSaving(true);
    try {
      // A blank title or date never blocks a save.
      const title = form.title.trim() || "Untitled report";
      const payload = { ...form, title, report_date: form.report_date || null, client_id: form.client_id || null };
      let savedId = reportId;
      if (!savedOnce.current) {
        const created = await createReport({ ...payload, id: reportId });
        savedOnce.current = true;
        savedId = created.id;
        setNumber(created.number);
        navigate(`/reports/${created.id}`, { replace: true });
      } else {
        await updateReport(reportId, payload);
      }
      if (!form.title.trim()) setForm((f) => ({ ...f, title }));
      try {
        localStorage.removeItem(backupKey("new"));
        localStorage.removeItem(backupKey(savedId));
      } catch {
        /* ignore */
      }
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit" }));
      return savedId;
    } catch (e) {
      const msg = formatSupabaseError(e);
      setSaveError(msg);
      showError(`Not saved: ${msg}`);
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!savedOnce.current) {
      navigate("/reports/list");
      return;
    }
    if (!confirm("Delete this report?")) return;
    try {
      await deleteReport(reportId);
      navigate("/reports/list");
    } catch (e) {
      showError(formatSupabaseError(e));
    }
  }

  const client = clients.find((c) => c.id === form.client_id);
  const customerEmail = client?.email?.trim() ?? "";

  async function openPrint() {
    const id = await persist();
    if (!id) return;
    try {
      const { url } = await ensureReportViewLink(id, window.location.origin);
      setViewUrl(url);
      window.open(`${url}&print=1`, "_blank", "noopener");
    } catch (e) {
      showError(formatSupabaseError(e));
    }
  }

  async function openInGmail() {
    if (!customerEmail) {
      showError("Add a customer email on the client record first.");
      return;
    }
    setSending(true);
    try {
      const id = await persist();
      if (!id) return;
      const { url } = await sendReportToCustomer(id, window.location.origin);
      setViewUrl(url);
      setStatus("sent");
      const first = client?.first_name?.trim() || (client ? clientDisplayName(client).split(/\s+/)[0] : undefined);
      openReportGmail({
        to: customerEmail,
        subject: `Report ${number}${form.title.trim() ? ` — ${form.title.trim()}` : ""}`,
        body: reportEmailBody({ customerName: first, reportLabel: `report ${number}`, linkUrl: url, senderName: docProfile.owner, businessName: docProfile.name }),
      });
    } catch (e) {
      showError(e instanceof Error ? e.message : formatSupabaseError(e));
    } finally {
      setSending(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold text-[var(--mp-navy)]">{isNew ? "New report" : `Report ${number}`}</h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowPreview(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
            <Eye size={15} /> Preview
          </button>
          <button type="button" onClick={openInGmail} disabled={sending || saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--mp-orange)] px-3 py-2 text-sm font-bold text-white disabled:opacity-60">
            <Mail size={15} /> {sending ? "Opening…" : "Send to customer"}
          </button>
        </div>
      </div>
      {status === "sent" && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Sent to the customer.</p>}

      {restore && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <p className="font-semibold">There is an unsaved copy of this report from {new Date(restore.at).toLocaleString("en-NZ")}. Restore it?</p>
          <div className="flex gap-2">
            <button type="button" className="rounded-lg bg-[var(--mp-navy)] px-3 py-1.5 font-bold text-white" onClick={() => { setForm({ ...restore.form, areas: restore.form.areas?.length ? restore.form.areas : [newArea()] }); setDirty(true); setRestore(null); }}>
              Restore
            </button>
            <button type="button" className="rounded-lg border border-sky-300 px-3 py-1.5 font-semibold" onClick={() => { try { localStorage.removeItem(backupKey(savedOnce.current ? reportId : "new")); } catch { /* ignore */ } setRestore(null); }}>
              Discard
            </button>
          </div>
        </div>
      )}

      <FormSaveBar placement="top" saveLabel="Save report" saving={saving} onSave={() => void persist()} cancelTo="/reports/list" hint={saveError ? `NOT SAVED: ${saveError}` : savedAt ? `Saved at ${savedAt}.` : dirty ? "You have changes that are not saved yet." : "Nothing is saved until you tap Save report."} />

      <form onSubmit={(e) => { e.preventDefault(); void persist(); }} className="mx-auto max-w-3xl space-y-6">
        <input required placeholder="Title, e.g. Exterior paint assessment" value={form.title} onChange={(e) => change({ ...form, title: e.target.value })} className={`${input} py-2.5`} />

        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <ClientSelect clients={clients} value={form.client_id} onChange={(v) => change({ ...form, client_id: v })} />
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Date</label>
            <input type="date" value={form.report_date} onChange={(e) => change({ ...form, report_date: e.target.value })} className={input} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Site address</label>
          <input placeholder="Where the work is (leave blank to use the client's address)" value={form.site_address} onChange={(e) => change({ ...form, site_address: e.target.value })} className={input} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Summary</label>
          <textarea rows={4} placeholder="What Richo found, in a few sentences" value={form.summary} onChange={(e) => change({ ...form, summary: e.target.value })} className={input} />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">Areas assessed</h2>
          {form.areas.map((a, i) => (
            <div key={a.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <input placeholder={`Area ${i + 1}, e.g. North wall`} value={a.area} onChange={(e) => setArea(a.id, { area: e.target.value })} className={`${input} font-semibold`} />
                <button type="button" aria-label="Remove this area" onClick={() => change((f) => ({ ...f, areas: f.areas.filter((x) => x.id !== a.id) }))} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400">What we found</label>
                <textarea rows={2} value={a.finding} onChange={(e) => setArea(a.id, { finding: e.target.value })} className={input} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Recommended work</label>
                <textarea rows={2} value={a.recommended} onChange={(e) => setArea(a.id, { recommended: e.target.value })} className={input} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {a.photos.map((p) => (
                  <div key={p} className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    {photoUrls[p] && <img src={photoUrls[p]} alt="" className="h-full w-full object-cover" />}
                    <button type="button" aria-label="Remove photo" onClick={() => void dropPhoto(a.id, p)} className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <label className="inline-flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                  <ImagePlus size={18} />
                  Photo
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void addPhotos(a.id, e.target.files); e.target.value = ""; }} />
                </label>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => change((f) => ({ ...f, areas: [...f.areas, newArea()] }))} className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--mp-orange)]">
            <Plus size={15} /> Add area
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Recommendations and next steps</label>
          <textarea rows={4} value={form.recommendations} onChange={(e) => change({ ...form, recommendations: e.target.value })} className={input} />
        </div>

        <RequestNotesCard notes={form.internal_notes} onChange={(internal_notes) => change({ ...form, internal_notes })} />

        {!isNew && (
          <button type="button" onClick={() => void remove()} className="text-sm font-semibold text-red-600 underline">
            Delete this report
          </button>
        )}
      </form>

      <FormSaveBar placement="bottom" saveLabel="Save report" saving={saving} onSave={() => void persist()} cancelTo="/reports/list" hint={saveError ? `NOT SAVED: ${saveError}` : savedAt ? `Saved at ${savedAt}.` : dirty ? "Not saved yet." : undefined} />

      <DocumentPreviewModal
        open={showPreview}
        title={`Report ${number}`}
        onClose={() => setShowPreview(false)}
        onSend={openInGmail}
        sendLabel="Open in Gmail"
        sending={sending}
        sendHint="Open in Gmail saves the report, creates the customer link and opens a draft to send. The customer sees a clean page with no prices."
        linkUrl={viewUrl || undefined}
        customerEmail={customerEmail || undefined}
        onPrint={openPrint}
      >
        <ReportDocument
          data={{
            number,
            title: form.title,
            report_date: form.report_date || null,
            site_address: form.site_address,
            summary: form.summary,
            areas: form.areas,
            recommendations: form.recommendations,
            clientName: client ? clientDisplayName(client) : "Customer",
            clientAddress: client?.address ?? "",
            clientEmail: customerEmail,
            profile: docProfile,
            photoUrls,
          }}
        />
      </DocumentPreviewModal>
    </div>
  );
}
