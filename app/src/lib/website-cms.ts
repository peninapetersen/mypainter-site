import { supabase } from "@/lib/supabase";

export type WebsitePage = {
  slug: string;
  label: string;
  path: string;
  blocks: string;
};

export const WEBSITE_PAGES: WebsitePage[] = [
  { slug: "index", label: "Home", path: "/", blocks: "Hero heading, subhead, intro" },
  { slug: "painting", label: "Painting", path: "/painting.html", blocks: "Hero heading, subhead" },
  { slug: "handyman", label: "Handyman", path: "/handyman.html", blocks: "Hero heading, subhead, intro" },
  { slug: "gallery", label: "Gallery", path: "/gallery.html", blocks: "Hero heading, subhead" },
  { slug: "about", label: "About Richo", path: "/about.html", blocks: "Hero, about paragraphs" },
  { slug: "contact", label: "Contact", path: "/contact.html", blocks: "Hero heading, subhead" },
];

export function editUrl(path: string, embedded = false): string {
  const url = new URL(path, window.location.origin);
  url.searchParams.set("edit", "1");
  if (embedded) url.searchParams.set("embedded", "1");
  return url.pathname + url.search;
}

export async function bridgeCmsSession(): Promise<{ ok: boolean; error?: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, error: "Not signed in" };
  const res = await fetch("/api/auth/app-bridge", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: body.error || "Could not enable website editing" };
  return { ok: true };
}

export async function cmsAuthenticated(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    return !!data.authenticated;
  } catch {
    return false;
  }
}
