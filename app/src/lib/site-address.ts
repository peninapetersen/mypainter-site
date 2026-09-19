import { formatPropertyOneLine } from "@/lib/client-display";
import type { Client, ClientProperty } from "@/types/entities";

/** Best address from client record + property rows. */
export function resolveClientSiteAddress(
  client: Client | null,
  properties: ClientProperty[],
): string {
  if (!client) return "";
  const primary = properties.find((p) => p.is_primary) ?? properties[0];
  if (primary) {
    const line = formatPropertyOneLine(primary);
    if (line.trim()) return line.trim();
  }
  return client.address?.trim() ?? "";
}

export function googleMapsEmbedUrl(address: string): string {
  const q = encodeURIComponent(address.trim());
  return `https://www.google.com/maps?q=${q}&hl=en&z=15&output=embed`;
}

export function googleMapsDirectionsUrl(address: string): string {
  const q = encodeURIComponent(address.trim());
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}

export function googleMapsSearchUrl(address: string): string {
  const q = encodeURIComponent(address.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
