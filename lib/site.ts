/** Public site identity, used for metadata, JSON-LD, the sitemap and the footer. */
export const SITE_NAME = "VideoGenEditor";
/** The name as the logo shows it. */
export const SITE_DISPLAY_NAME = "Video Gen Editor";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://videogeneditor.com").replace(/\/$/, "");

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

/**
 * Tool pages, in the order the footer lists them. `updated` is the sitemap
 * lastModified: bump it by hand only when the page's content changes.
 */
export const toolLinks = [
  { href: "/", label: "AI Video Generator", updated: "2026-09-28" },
  { href: "/text-to-video", label: "Text to Video", updated: "2026-09-28" },
  { href: "/image-to-video", label: "Image to Video", updated: "2026-09-28" },
  { href: "/ai-video-editor", label: "AI Video Editor", updated: "2026-09-28" },
  { href: "/ai-video-extender", label: "AI Video Extender", updated: "2026-09-28" },
  { href: "/ai-music-video-generator", label: "AI Music Video Generator", updated: "2026-09-28" },
  { href: "/lyric-video-generator", label: "Lyric Video Generator", updated: "2026-09-28" },
  { href: "/ai-ugc-video-generator", label: "AI UGC Video Generator", updated: "2026-09-28" },
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
  legalName: "Video Gen Editor",
  address: "India",
  governingLaw: "India",
  supportEmail: "support@videogeneditor.com",
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
