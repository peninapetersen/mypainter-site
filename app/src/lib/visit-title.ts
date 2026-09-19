export function renderVisitTitle(
  template: string,
  vars: { clientName: string; jobTitle: string; jobNumber?: string },
): string {
  return template
    .replace(/\{\{CLIENT_NAME\}\}/g, vars.clientName || "Client")
    .replace(/\{\{JOB_TITLE\}\}/g, vars.jobTitle || "Job")
    .replace(/\{\{JOB_NUMBER\}\}/g, vars.jobNumber || "");
}

export function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  if (cur > last) return [start];
  while (cur <= last && out.length < 20) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}
