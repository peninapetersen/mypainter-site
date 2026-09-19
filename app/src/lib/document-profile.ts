import { BUSINESS_PROFILE } from "@/lib/business-profile";
import type { WorkSettings } from "@/types/entities";

export type DocumentProfile = {
  name: string;
  owner: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
};

export function documentProfileFromSettings(ws: WorkSettings | null | undefined): DocumentProfile {
  const w = ws as WorkSettings & {
    document_phone?: string;
    document_email?: string;
    document_tagline?: string;
  };
  return {
    name: BUSINESS_PROFILE.name,
    owner: BUSINESS_PROFILE.owner,
    tagline: w?.document_tagline?.trim() || BUSINESS_PROFILE.tagline,
    phone: w?.document_phone?.trim() || BUSINESS_PROFILE.phone,
    email: w?.document_email?.trim() || BUSINESS_PROFILE.email,
    website: BUSINESS_PROFILE.website,
    logoUrl: BUSINESS_PROFILE.logoUrl,
  };
}
