import { formatPropertyOneLine } from "@/lib/client-display";
import { getClientBundle } from "@/lib/clients";
import { getJob } from "@/lib/jobs";

/** Best site address for Jobs On — lead site → client property → client address. */
export async function resolveJobsOnSiteAddress(input: {
  client_id?: string | null;
  lead_id?: string | null;
  fallback?: string;
}): Promise<string> {
  if (input.lead_id) {
    const lead = await getJob(input.lead_id).catch(() => null);
    if (lead?.site_address?.trim()) return lead.site_address.trim();
  }
  if (input.client_id) {
    const bundle = await getClientBundle(input.client_id).catch(() => null);
    if (bundle) {
      const primary = bundle.properties.find((p) => p.is_primary) ?? bundle.properties[0];
      if (primary) {
        const line = formatPropertyOneLine(primary);
        if (line.trim()) return line;
      }
      if (bundle.client.address?.trim()) return bundle.client.address.trim();
    }
  }
  return input.fallback?.trim() ?? "";
}
