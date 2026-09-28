import type { MetadataRoute } from "next";
import { articles } from "@/app/_seo/articles";
import { LEGAL_UPDATED } from "@/app/_seo/company-page";
import { absoluteUrl, companyLinks, toolLinks } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...toolLinks.map((l) => ({
      url: absoluteUrl(l.href),
      changeFrequency: "weekly" as const,
      priority: l.href === "/" ? 1 : 0.9,
    })),
    { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.6 },
    ...articles.map((a) => ({
      url: absoluteUrl(a.path),
      lastModified: a.updated,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...companyLinks.map((l) => ({
      url: absoluteUrl(l.href),
      lastModified: LEGAL_UPDATED,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
