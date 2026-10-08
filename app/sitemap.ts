import type { MetadataRoute } from "next";
import { articles } from "@/app/_seo/articles";
import { LEGAL_UPDATED } from "@/app/_seo/company-page";
import { MODELS_UPDATED, modelPages } from "@/app/_seo/model-pages";
import { absoluteUrl, companyLinks, toolLinks } from "@/lib/site";

// The blog index changes whenever any article does. ISO dates sort as strings.
const BLOG_UPDATED = articles.map((a) => a.updated).sort().at(-1);

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...toolLinks.map((l) => ({
      url: absoluteUrl(l.href),
      lastModified: l.updated,
    })),
    { url: absoluteUrl("/models"), lastModified: MODELS_UPDATED },
    ...modelPages.map((m) => ({
      url: absoluteUrl(`/models/${m.slug}`),
      lastModified: MODELS_UPDATED,
    })),
    { url: absoluteUrl("/blog"), lastModified: BLOG_UPDATED },
    ...articles.map((a) => ({
      url: absoluteUrl(a.path),
      lastModified: a.updated,
    })),
    ...companyLinks.map((l) => ({
      url: absoluteUrl(l.href),
      lastModified: LEGAL_UPDATED,
    })),
  ];
}
