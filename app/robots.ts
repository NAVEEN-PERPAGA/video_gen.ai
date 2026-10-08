import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The app itself (studio, billing): per-user pages with nothing to index.
      disallow: ["/api/", "/auth/", "/login", "/generate", "/billing"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
