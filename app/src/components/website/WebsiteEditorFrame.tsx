import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, Pencil, Square } from "lucide-react";
import { WEBSITE_PAGES, editUrl } from "@/lib/website-cms";

export function WebsiteEditorFrame({
  path,
  onBack,
  onPathChange,
}: {
  path: string;
  onBack: () => void;
  onPathChange: (path: string) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [editOn, setEditOn] = useState(true);
  const page = WEBSITE_PAGES.find((p) => p.path === path);

  const postEdit = useCallback((on: boolean) => {
    iframeRef.current?.contentWindow?.postMessage({ type: "mp-cms-edit", on }, window.location.origin);
    setEditOn(on);
  }, []);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "mp-cms-edit-state") setEditOn(!!e.data.on);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="-mx-4 -mb-4 -mt-2 flex min-h-[calc(100dvh-3.75rem)] flex-col md:-mx-6 md:-mb-6">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={14} />
          All pages
        </button>

        <select
          value={path}
          onChange={(e) => onPathChange(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm font-semibold"
        >
          {WEBSITE_PAGES.map((p) => (
            <option key={p.slug} value={p.path}>
              {p.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => postEdit(!editOn)}
          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-bold ${
            editOn ? "bg-[var(--mp-navy)] text-white" : "bg-[var(--mp-orange)] text-white"
          }`}
        >
          {editOn ? (
            <>
              <Square size={14} /> Stop editing
            </>
          ) : (
            <>
              <Pencil size={14} /> Edit text
            </>
          )}
        </button>

        <p className="hidden text-xs text-slate-500 sm:block">
          Click yellow boxes — saves when you click away.
        </p>

        <a
          href={editUrl(path)}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-500 underline hover:text-slate-800"
        >
          Open in new tab
          <ExternalLink size={12} />
        </a>
      </div>

      <iframe
        ref={iframeRef}
        key={path}
        src={editUrl(path, true)}
        title={page ? `Edit ${page.label}` : "Edit website page"}
        className="min-h-0 w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
