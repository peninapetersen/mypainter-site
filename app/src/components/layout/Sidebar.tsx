import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NAV_ITEMS } from "@/config/nav";

const STORAGE_KEY = "mp-sidebar-collapsed";

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const inner = (
    <aside
      className={`flex h-full flex-col bg-[var(--mp-sidebar)] text-white transition-all ${
        collapsed ? "w-[68px]" : "w-56"
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-4">
        {!collapsed && <span className="text-sm font-bold tracking-wide">MyPainter</span>}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden rounded p-1 hover:bg-white/10 md:block"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map((item) => (
          <div key={item.path}>
            <NavLink
              to={item.path}
              end={item.path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
            {!collapsed &&
              item.children?.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `ml-10 mr-2 block rounded-lg px-3 py-1.5 text-xs ${
                      isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                    }`
                  }
                >
                  {child.label}
                </NavLink>
              ))}
          </div>
        ))}
      </nav>
      <a
        href="/"
        className="m-2 block rounded-lg px-3 py-2 text-center text-xs text-white/70 hover:bg-white/10"
      >
        {collapsed ? "↗" : "Public site →"}
      </a>
    </aside>
  );

  return (
    <>
      <div className="hidden md:block">{inner}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close menu" />
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-hidden rounded-t-2xl">{inner}</div>
        </div>
      )}
    </>
  );
}
