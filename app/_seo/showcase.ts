/**
 * Clips for the home page gallery. Only real outputs from the studio: each
 * entry says which model made it, with what prompt, at what length and cost,
 * so it doubles as proof of the "compare models" pitch. The section is hidden
 * while the list is empty.
 *
 * Host the files somewhere public (e.g. the R2 bucket), keep each video short
 * (under ~2 MB, muted, a few seconds) and give it a poster frame, so the page
 * stays fast: videos load only when played.
 */
export interface ShowcaseClip {
  /** Model page slug (app/_seo/model-pages.ts), for the label and the link. */
  model: string;
  prompt: string;
  /** Public URL of an MP4. */
  video: string;
  /** Public URL of a still from the clip, shown before it plays. */
  poster: string;
  seconds: number;
  resolution: string;
  /** What the clip cost to generate, in USD. */
  cost: number;
  aspect: "16:9" | "9:16" | "1:1";
}

export const SHOWCASE: ShowcaseClip[] = [];
