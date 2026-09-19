import type { ReactNode } from "react";

/** Jobber-style two-column section: label left, fields right. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-6 border-b border-slate-200 py-8 lg:grid-cols-[minmax(0,280px)_1fr]">
      <div>
        <h2 className="text-base font-bold text-[var(--mp-navy)]">{title}</h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
