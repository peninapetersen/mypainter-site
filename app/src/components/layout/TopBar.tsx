import { useEffect, useRef, useState } from "react";
import { Bell, Menu, Plus, Search, User } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { NEW_MENU_LINKS } from "@/config/nav";

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const [newOpen, setNewOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [email, setEmail] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setNewOpen(false);
        setAvatarOpen(false);
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/app/login";
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <button type="button" className="rounded p-2 hover:bg-slate-100 md:hidden" onClick={onMenuClick}>
        <Menu size={20} />
      </button>
      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          disabled
          placeholder="Search (coming soon)"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-500"
        />
      </div>
      <div className="ml-auto flex items-center gap-2" ref={ref}>
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg bg-[var(--mp-orange)] px-3 py-2 text-sm font-bold text-white"
            onClick={() => {
              setNewOpen(!newOpen);
              setAvatarOpen(false);
            }}
          >
            <Plus size={16} /> New
          </button>
          {newOpen && (
            <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border bg-white py-1 shadow-lg">
              {NEW_MENU_LINKS.map((l) => (
                <Link
                  key={l.path}
                  to={l.path}
                  className="block px-3 py-2 text-sm hover:bg-slate-50"
                  onClick={() => setNewOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <div className="relative">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-slate-100"
            onClick={() => {
              setAvatarOpen(!avatarOpen);
              setNewOpen(false);
            }}
          >
            <User size={20} />
          </button>
          {avatarOpen && (
            <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border bg-white py-2 shadow-lg">
              <p className="truncate px-3 pb-2 text-xs text-slate-500">{email || "Signed in"}</p>
              <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={logout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
