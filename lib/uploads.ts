/**
 * Image and video uploads: the shapes node_scalable's /workspaces/:id/uploads answers
 * with, shared by the Route Handlers under app/api and the browser.
 */

/** An image or video file stored in the workspace (Cloudflare R2). */
export interface Upload {
  id: number;
  workspaceId: number;
  /** From the content type; null for a type the API no longer recognises. */
  kind: "video" | "image" | null;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** 'pending' until POST .../complete confirms the file is in storage. */
  status: "pending" | "uploaded";
  /** Where to read the video; null while pending. */
  url: string | null;
  /** When `url` stops working; null for permanent public links. */
  urlExpiresAt: string | null;
  createdAt: string;
}

/** Where the browser PUTs the file: straight to storage, with exactly these headers (they're signed). */
export interface UploadTarget {
  method: "PUT";
  url: string;
  headers: Record<string, string>;
  expiresAt: string;
}

/** This app's upload endpoints (app/api/workspaces/[workspaceId]/uploads). */
export function uploadsPath(workspaceId: number, uploadId?: number, action?: "complete") {
  return ["/api/workspaces", workspaceId, "uploads", uploadId, action].filter((p) => p !== undefined).join("/");
}
