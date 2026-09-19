import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Ctx = {
  message: string | null;
  showError: (msg: string) => void;
  dismiss: () => void;
};

const ErrorBannerContext = createContext<Ctx | null>(null);

export function ErrorBannerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const showError = useCallback((msg: string) => setMessage(msg), []);
  const dismiss = useCallback(() => setMessage(null), []);
  const value = useMemo(() => ({ message, showError, dismiss }), [message, showError, dismiss]);
  return <ErrorBannerContext.Provider value={value}>{children}</ErrorBannerContext.Provider>;
}

export function useErrorBanner() {
  const ctx = useContext(ErrorBannerContext);
  if (!ctx) throw new Error("useErrorBanner outside provider");
  return ctx;
}
