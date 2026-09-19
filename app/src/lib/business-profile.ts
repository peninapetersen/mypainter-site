/** MyPainter — on customer-facing quote & invoice documents */
export const BUSINESS_PROFILE = {
  name: "MyPainter",
  owner: "Richard Petersen",
  tagline: "Painting & Handyman · Whangarei & Northland",
  phone: "021 083 01415",
  email: "mypaintermate@gmail.com",
  website: "mypainter.co.nz",
  /** Real PNG logo — same file as mypainter.co.nz site header */
  logoUrl: "/images/logo.png",
  logoFallbackUrl: "/images/logo.svg",
  gstNumber: "", // add when registered — shown when set
} as const;
