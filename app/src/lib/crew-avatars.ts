import { clientDisplayName } from "@/lib/client-display";
import { contractorDisplayName } from "@/lib/contractors";
import type { Client, Contractor, CrewTimesheet } from "@/types/entities";

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Resolve storage path for a timesheet row avatar. */
export function resolveCrewPhotoPath(
  t: CrewTimesheet,
  ctx: {
    client?: Client | null;
    contractors: Contractor[];
  },
): string {
  if (t.contractor_id) {
    const c = ctx.contractors.find((x) => x.id === t.contractor_id);
    if (c?.photo_path) return c.photo_path;
  }

  const crew = norm(t.crew_member);
  if (!crew) return ctx.client?.photo_path ?? "";

  for (const c of ctx.contractors) {
    const names = [contractorDisplayName(c), c.name, c.company_name].filter(Boolean).map(norm);
    if (names.some((n) => n === crew || crew.includes(n) || n.includes(crew))) {
      return c.photo_path ?? "";
    }
  }

  if (ctx.client) {
    const clientNames = [
      clientDisplayName(ctx.client),
      ctx.client.name,
      [ctx.client.first_name, ctx.client.last_name].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .map(norm);
    if (clientNames.some((n) => n === crew || crew.includes(n) || n.includes(crew))) {
      return ctx.client.photo_path ?? "";
    }
  }

  return ctx.client?.photo_path ?? "";
}

export function avatarInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (label.trim()[0] ?? "?").toUpperCase();
}
