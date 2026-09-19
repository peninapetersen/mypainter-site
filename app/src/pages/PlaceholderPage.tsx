export function PlaceholderPage({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
        Phase 2+ — features coming here
      </div>
    </div>
  );
}
