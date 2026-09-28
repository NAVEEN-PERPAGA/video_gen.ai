/** Public site identity, used for metadata, JSON-LD, the sitemap and the footer. */
export const SITE_NAME = "VideoGenEditor";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://videogeneditor.com").replace(/\/$/, "");

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

/** Tool pages, in the order the footer lists them. */
export const toolLinks = [
  { href: "/", label: "AI Video Generator" },
  { href: "/text-to-video", label: "Text to Video" },
  { href: "/image-to-video", label: "Image to Video" },
  { href: "/ai-video-editor", label: "AI Video Editor" },
  { href: "/ai-video-extender", label: "AI Video Extender" },
  { href: "/ai-music-video-generator", label: "AI Music Video Generator" },
  { href: "/lyric-video-generator", label: "Lyric Video Generator" },
  { href: "/ai-ugc-video-generator", label: "AI UGC Video Generator" },
] as const;

export const blogLinks = [
  { href: "/blog/best-free-ai-video-generators", label: "Best Free AI Video Generators" },
  { href: "/blog/how-to-make-ai-video", label: "How to Make an AI Video" },
] as const;

/**
 * Company details used by the legal and contact pages. Bracketed values are
 * placeholders: replace them (and confirm the mailboxes exist) before launch.
 */
export const COMPANY = {
  legalName: "[Company legal name]",
  address: "[Registered business address]",
  governingLaw: "[country or state]",
  supportEmail: "support@videogeneditor.com",
  privacyEmail: "privacy@videogeneditor.com",
  legalEmail: "legal@videogeneditor.com",
  /** Youngest age allowed to use the service. */
  minimumAge: 18,
} as const;

export const companyLinks = [
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/acceptable-use", label: "Acceptable Use Policy" },
  { href: "/refund-policy", label: "Refund Policy" },
] as const;
