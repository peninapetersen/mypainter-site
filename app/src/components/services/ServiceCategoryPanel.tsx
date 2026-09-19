import type { ServiceCategory } from "@/types/service-categories";

/** Filter chips — click to filter list by category slug (null = all). */
export function ServiceCategoryFilters({
  categories,
  selected,
  onSelect,
}: {
  categories: ServiceCategory[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}) {
  const active = categories.filter((c) => c.active);
  if (active.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`rounded-full px-3 py-1 text-sm font-semibold ${
          selected === null
            ? "bg-[var(--mp-navy)] text-white"
            : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        All
      </button>
      {active.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.slug)}
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            selected === cat.slug
              ? "bg-[var(--mp-orange)] text-white"
              : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
