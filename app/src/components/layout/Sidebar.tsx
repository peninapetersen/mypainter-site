import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { NAV_ITEMS } from "@/config/nav";

const STORAGE_KEY = "mp-sidebar-collapsed";

function childMatches(pathname: string, childPath: string): boolean {
  const base = childPath.replace(/\/list$/, "");
  return pathname === childPath || pathname.startsWith(`${base}/`);
}

function sectionActive(pathname: string, item: (typeof NAV_ITEMS)[number]): boolean {
  if (item.children?.some((child) => childMatches(pathname, child.path))) return true;
  if (pathname === item.path) return true;
  const base = item.path.replace(/\/list$/, "");
  if (item.path.endsWith("/list")) {
    return pathname === base || pathname.startsWith(`${base}/`);
  }
  return pathname.startsWith(`${item.path}/`);
}

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  /** User manually collapsed — auto-expand must not reopen until they navigate away. */
  const userClosedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    setOpenSections(() => {
      const next: Record<string, boolean> = {};
      for (const item of NAV_ITEMS) {
        if (!item.children?.length) continue;
        const onChild = item.children.some((child) => childMatches(location.pathname, child.path));
        if (userClosedRef.current.has(item.path)) {
          next[item.path] = false;
        } else {
          next[item.path] = onChild;
        }
      }
      return next;
    });
  }, [location.pathname]);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  function toggleSection(path: string) {
    setOpenSections((prev) => {
      const willOpen = !prev[path];
      if (willOpen) {
        userClosedRef.current.delete(path);
      } else {
        userClosedRef.current.add(path);
      }
      return { ...prev, [path]: willOpen };
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
        {NAV_ITEMS.map((item) => {
          const hasChildren = !!item.children?.length;
          const isOpen = !!openSections[item.path];
          const active = sectionActive(location.pathname, item);

          if (hasChildren) {
            return (
              <div key={item.path}>
                <button
                  type="button"
                  onClick={() => {
                    if (collapsed) {
                      toggleCollapsed();
                      userClosedRef.current.delete(item.path);
                      setOpenSections((prev) => ({ ...prev, [item.path]: true }));
                    } else {
                      toggleSection(item.path);
                    }
                  }}
                  className={`mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    active ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                  title={collapsed ? item.label : undefined}
                  aria-expanded={isOpen}
                >
                  <item.icon size={20} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </>
                  )}
                </button>
                {!collapsed && isOpen &&
                  item.children!.map((child) => (
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
            );
          }

          return (
            <div key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                onClick={() => {
                  onClose();
                  // Leaving contacts area — allow auto-expand again next visit
                  userClosedRef.current.clear();
                }}
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
            </div>
          );
        })}
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
