import { FormEvent, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export function LoginPage() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  if (authed === null) {
    return <div className="flex min-h-full items-center justify-center text-white">Loading…</div>;
  }
  if (authed) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setAuthed(true);
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-[var(--mp-navy)] p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <img src="/images/logo.png" alt="MyPainter" className="mx-auto mb-6 h-10 w-auto" />
        <h1 className="mb-1 text-center text-xl font-bold text-slate-900">Business login</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Richard&apos;s job management app</p>
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <label className="mb-3 block text-sm font-semibold">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            autoComplete="email"
          />
        </label>
        <label className="mb-6 block text-sm font-semibold">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            autoComplete="current-password"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--mp-orange)] py-2.5 font-bold text-white disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="mt-4 text-center text-xs text-slate-400">
          <a href="/" className="underline">
            Back to public site
          </a>
        </p>
      </form>
    </div>
  );
}
