/**
 * The public /explore gallery: the shapes node_scalable's /explore/videos and
 * /admin/explore-videos answer with, shared by the pages and the browser.
 */

/** A video on /explore, uploaded by a site admin to R2. */
export interface ExploreVideo {
  id: number;
  title: string;
  description: string | null;
  prompt: string | null;
  /** Runware AIR id of the model that made it, if the admin gave one. */
  model: string | null;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** 'pending' until the upload is confirmed. The public list holds only 'uploaded'. */
  status: "pending" | "uploaded";
  /** Where to play the video; null while pending. */
  url: string | null;
  /** When `url` stops working; null for permanent public links. */
  urlExpiresAt: string | null;
  createdAt: string;
}

/** Video types the API accepts for /explore (node_scalable's MEDIA_TYPES, videos only). */
export const EXPLORE_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
  "video/ogg",
  "video/mpeg",
  "video/x-msvideo",
  "video/3gpp",
];
