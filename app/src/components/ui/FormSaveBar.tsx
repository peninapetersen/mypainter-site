import { Link } from "react-router-dom";

export function FormSaveBar({
  saveLabel,
  saving,
  onSave,
  cancelTo,
  hint,
  placement = "bottom",
}: {
  saveLabel: string;
  saving: boolean;
  onSave: () => void;
  cancelTo: string;
  hint?: string;
  placement?: "top" | "bottom";
}) {
  const actions = (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Link
        to={cancelTo}
        className="rounded-lg border border-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-[var(--mp-orange)]"
      >
        Cancel
      </Link>
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="rounded-lg bg-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-60"
      >
        {saving ? "Saving…" : saveLabel}
      </button>
    </div>
  );

  if (placement === "top") {
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-medium text-amber-950">
          {hint ?? "Nothing is saved until you tap Save."}
        </p>
        {actions}
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white px-4 py-3 md:left-56">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : <span />}
        {actions}
      </div>
    </div>
  );
}
