import { useEffect, useState } from "react";
import { ExternalLink, Globe, Image, Pencil, RefreshCw } from "lucide-react";
import { WebsiteEditorFrame } from "@/components/website/WebsiteEditorFrame";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import {
  WEBSITE_PAGES,
  bridgeCmsSession,
  cmsAuthenticated,
} from "@/lib/website-cms";

export function WebsitePage() {
  const { showError } = useErrorBanner();
  const [ready, setReady] = useState<boolean | null>(null);
  const [bridging, setBridging] = useState(false);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  async function enableEditing() {
    setBridging(true);
    try {
      const result = await bridgeCmsSession();
      if (!result.ok) {
        showError(result.error ?? "Could not enable editing");
        setReady(false);
        return;
      }
      setReady(true);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Bridge failed");
      setReady(false);
    } finally {
      setBridging(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (await cmsAuthenticated()) {
          if (!cancelled) setReady(true);
          return;
        }
        if (!cancelled) setBridging(true);
        const result = await bridgeCmsSession();
        if (cancelled) return;
        if (result.ok) setReady(true);
        else {
          showError(result.error ?? "Could not enable editing");
          setReady(false);
        }
      } catch (e) {
        if (!cancelled) {
          showError(e instanceof Error ? e.message : "Bridge failed");
          setReady(false);
        }
      } finally {
        if (!cancelled) setBridging(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showError]);

  if (editingPath) {
    return (
      <WebsiteEditorFrame
        path={editingPath}
        onBack={() => setEditingPath(null)}
        onPathChange={setEditingPath}
      />
    );
  }

  if (galleryOpen) {
    return (
      <div className="-mx-4 -mb-4 -mt-2 flex min-h-[calc(100dvh-3.75rem)] flex-col md:-mx-6 md:-mb-6">
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
          <button
            type="button"
            onClick={() => setGalleryOpen(false)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700"
          >
            ← All pages
          </button>
          <span className="text-sm font-bold text-[var(--mp-navy)]">Gallery manager</span>
        </div>
        <iframe
          src="/admin/gallery.html"
          title="Gallery manager"
          className="min-h-0 w-full flex-1 border-0 bg-white"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--mp-navy)]">
            <Globe size={26} className="text-[var(--mp-orange)]" />
            Website
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Edit mypainter.co.nz inline — stays inside the app.
          </p>
        </div>
        <button
          type="button"
          onClick={enableEditing}
          disabled={bridging}
          className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={14} className={bridging ? "animate-spin" : ""} />
          {bridging ? "Connecting…" : "Refresh edit access"}
        </button>
      </div>

      {ready === null && <p className="text-slate-500">Preparing website editor…</p>}

      {ready === false && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Could not connect editing. Press <strong>Refresh edit access</strong> or sign out and back in.
        </div>
      )}

      {ready && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Click <strong>Edit page</strong> — the live site opens here. Yellow boxes are editable text.
        </div>
      )}

      <div className="space-y-3">
        {WEBSITE_PAGES.map((page) => (
          <div
            key={page.slug}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div>
              <p className="font-bold text-[var(--mp-navy)]">{page.label}</p>
              <p className="text-xs text-slate-500">{page.blocks}</p>
            </div>
            <div className="flex gap-2">
              <a
                href={page.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink size={14} />
                View live
              </a>
              <button
                type="button"
                onClick={() => setEditingPath(page.path)}
                disabled={!ready}
                className="flex items-center gap-1 rounded-lg bg-[var(--mp-orange)] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                <Pencil size={14} />
                Edit page
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="flex items-center gap-2 font-bold text-[var(--mp-navy)]">
          <Image size={18} />
          Gallery photos
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Upload, caption, and publish work photos shown on the Gallery page.
        </p>
        <button
          type="button"
          onClick={() => setGalleryOpen(true)}
          disabled={!ready}
          className="mt-3 text-sm font-semibold text-[var(--mp-orange)] underline disabled:opacity-50"
        >
          Manage gallery
        </button>
      </div>
    </div>
  );
}
