/**
 * Browser helpers for the editor's media: measuring files and formatting
 * times. Client-only (they use media elements).
 */
import type { Aspect } from "./timeline";

/** How long to wait for a file's metadata before giving up. */
const PROBE_TIMEOUT_MS = 20_000;

export interface MediaInfo {
  /** Seconds; 0 for images. */
  duration: number;
  /** Pixels; 0 for audio. */
  width: number;
  height: number;
}

/**
 * Length and size of the file at `url`, read by a detached media element
 * (no CORS needed). Rejects if it can't be loaded.
 */
export function probeMedia(url: string, kind: "video" | "audio" | "image"): Promise<MediaInfo> {
  const probe = kind === "image" ? probeImage(url) : probeTimed(url, kind);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("The file took too long to load.")), PROBE_TIMEOUT_MS);
  });
  return Promise.race([probe, timeout]).finally(() => clearTimeout(timer));
}

function probeImage(url: string): Promise<MediaInfo> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ duration: 0, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Couldn't load the image."));
    img.src = url;
  });
}

function probeTimed(url: string, kind: "video" | "audio"): Promise<MediaInfo> {
  const el = document.createElement(kind);
  el.preload = "metadata";
  el.muted = true;
  return new Promise<MediaInfo>((resolve, reject) => {
    el.onloadedmetadata = () => {
      const { duration } = el;
      const video = el instanceof HTMLVideoElement ? el : null;
      if (Number.isFinite(duration) && duration > 0) {
        resolve({ duration, width: video?.videoWidth ?? 0, height: video?.videoHeight ?? 0 });
      } else {
        reject(new Error("Couldn't tell how long the file is."));
      }
    };
    el.onerror = () => reject(new Error("Couldn't load the file."));
    el.src = url;
  }).finally(() => {
    // Only the metadata was needed: stop the download.
    el.removeAttribute("src");
    el.load();
  });
}

/** The editor aspect ratio closest to a picture's shape. */
export function aspectFor({ width, height }: { width: number; height: number }): Aspect {
  if (!width || !height) return "16:9";
  const ratio = width / height;
  return ratio > 1.2 ? "16:9" : ratio < 0.8 ? "9:16" : "1:1";
}

/** 75.4 -> "1:15.4" (tenths), or "1:15" with `tenths: false`. */
export function formatTime(seconds: number, { tenths = true } = {}): string {
  // Round first, so 59.96 shows as 1:00.0, not 0:60.0.
  const units = tenths ? Math.round(Math.max(0, seconds) * 10) : Math.floor(Math.max(0, seconds)) * 10;
  const minutes = Math.floor(units / 600);
  const rest = (units % 600) / 10;
  const secs = tenths ? rest.toFixed(1).padStart(4, "0") : String(rest).padStart(2, "0");
  return `${minutes}:${secs}`;
}
