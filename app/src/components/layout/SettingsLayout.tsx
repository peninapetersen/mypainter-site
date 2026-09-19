import { Link, useLocation } from "react-router-dom";

const SECTIONS = [
  { heading: "Business management", items: [{ label: "Company settings", disabled: true }, { label: "Expense tracking", to: "/expenses" }] },
  {
    heading: "Team organisation",
    items: [
      { label: "Work settings", to: "/settings/work" },
      { label: "Schedule", to: "/schedule" },
    ],
  },
  { heading: "Client communication", items: [{ label: "Requests and bookings", to: "/requests" }] },
];

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-56">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">Settings</h2>
        <nav className="space-y-4">
          {SECTIONS.map((sec) => (
            <div key={sec.heading}>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{sec.heading}</p>
              <ul className="space-y-0.5">
                {sec.items.map((item) =>
                  item.disabled ? (
                    <li key={item.label} className="px-2 py-1.5 text-sm text-slate-300">
                      {item.label}
                    </li>
                  ) : (
                    <li key={item.label}>
                      <Link
                        to={item.to!}
                        className={`block rounded-lg px-2 py-1.5 text-sm ${
                          pathname === item.to
                            ? "bg-emerald-50 font-semibold text-emerald-800"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
