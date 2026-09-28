/** Blog posts, for the /blog index, the sitemap and each post's metadata. */
export interface ArticleInfo {
  path: string;
  /** <title>, 60 characters or fewer. */
  title: string;
  h1: string;
  description: string;
  published: string;
  updated: string;
}

export const bestFreeGenerators: ArticleInfo = {
  path: "/blog/best-free-ai-video-generators",
  title: "10 Best Free AI Video Generators in 2026",
  h1: "The 10 Best Free AI Video Generators in 2026",
  description:
    "The best free AI video generators compared: what each one is good at, what its free plan gets you, and the catches (watermarks, limits, commercial use).",
  published: "2026-09-28",
  updated: "2026-09-28",
};

export const howToMakeAiVideo: ArticleInfo = {
  path: "/blog/how-to-make-ai-video",
  title: "How to Make an AI Video (Free, Step by Step)",
  h1: "How to Make an AI Video: A Free, Step-by-Step Guide",
  description:
    "How to make an AI video from text, a photo or a song: writing prompts, picking a model, generating for free, and making an AI tribute video, step by step.",
  published: "2026-09-28",
  updated: "2026-09-28",
};

export const articles = [bestFreeGenerators, howToMakeAiVideo];
