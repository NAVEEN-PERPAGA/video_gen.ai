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
