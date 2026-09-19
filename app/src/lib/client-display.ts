import type { Client, ClientProperty } from "@/types/entities";

export function clientDisplayName(c: Pick<Client, "company_name" | "first_name" | "last_name" | "name">): string {
  if (c.company_name.trim()) return c.company_name.trim();
  const person = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  if (person) return person;
  return c.name.trim() || "Unnamed client";
}

export function formatPropertyOneLine(p: ClientProperty): string {
  return [p.street_1, p.street_2, p.city, p.region, p.postal_code, p.country].filter(Boolean).join(", ");
}

export function buildClientName(fields: {
  company_name?: string;
  first_name?: string;
  last_name?: string;
}): string {
  if (fields.company_name?.trim()) return fields.company_name.trim();
  return [fields.first_name, fields.last_name].filter(Boolean).join(" ").trim();
}

export function buildLegacyAddress(p: ClientProperty): string {
  return formatPropertyOneLine(p);
}
