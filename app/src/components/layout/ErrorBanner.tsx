import { useErrorBanner } from "@/context/ErrorBannerContext";

export function ErrorBanner() {
  const { message, dismiss } = useErrorBanner();
  if (!message) return null;
  return (
    <div className="flex items-center justify-between gap-3 bg-red-600 px-4 py-2 text-sm font-semibold text-white">
      <span>{message}</span>
      <button type="button" onClick={dismiss} className="rounded px-2 py-0.5 hover:bg-red-700">
        Dismiss
      </button>
    </div>
  );
}
