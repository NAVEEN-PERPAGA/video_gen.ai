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
    "The best free AI video generators, compared honestly: what each one is good at, what the free plan really gets you, and the catches to watch for.",
  published: "2026-09-28",
  updated: "2026-10-08",
};

export const howToMakeAiVideo: ArticleInfo = {
  path: "/blog/how-to-make-ai-video",
  title: "How to Make an AI Video (Free, Step by Step)",
  h1: "How to Make an AI Video: A Free, Step-by-Step Guide",
  description:
    "How to make an AI video from text, a photo or a song: write a prompt that works, pick the right model, keep costs down, and put the clips together.",
  published: "2026-09-28",
  updated: "2026-10-08",
};

export const articles = [bestFreeGenerators, howToMakeAiVideo];
