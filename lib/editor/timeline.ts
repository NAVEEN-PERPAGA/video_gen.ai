/**
 * The editor's project format: a timeline of clips, text and audio, saved as
 * JSON on the project (node_scalable /workspaces/:id/projects) and rendered
 * by the Remotion composition in ./composition.tsx.
 *
 * KEEP IN SYNC: node_scalable/remotion/timeline.ts is a verbatim copy (the
 * server renders the same composition the browser previews), and
 * node_scalable/src/modules/projects/projects.schema.ts validates this shape.
 * No imports, so the file can be copied as is.
 */

export const TIMELINE_VERSION = 1;

/** Frames per second of the preview and the rendered video. */
export const FPS = 30;

/** Output size per aspect ratio. */
export const ASPECTS = {
  "16:9": { width: 1920, height: 1080, label: "Landscape" },
  "9:16": { width: 1080, height: 1920, label: "Portrait" },
  "1:1": { width: 1080, height: 1080, label: "Square" },
} as const;
export type Aspect = keyof typeof ASPECTS;

/** Limits, also enforced by the API. */
export const LIMITS = {
  clips: 100,
  texts: 50,
  audio: 10,
  /** Longest video the editor makes, in seconds. */
  durationSeconds: 600,
  textLength: 300,
  /** Shortest clip, in seconds (a few frames). */
  minClipSeconds: 0.1,
  /** Default length of an image clip or a new text, in seconds. */
  defaultStillSeconds: 3,
};

/**
 * Where a clip's media lives: one output of a generation, or an upload.
 * Ids, not URLs: URLs expire, so they're resolved each time the project opens
 * (and again by the server when it renders).
 */
export type MediaRef = { type: "generation"; id: number; index: number } | { type: "upload"; id: number };

/** A video or image on the main track. Visual clips play back to back, in order. */
export interface VisualClip {
  id: string;
  kind: "video" | "image";
  media: MediaRef;
  /** Seconds into the source where the clip starts (always 0 for images). */
  trimStart: number;
  /** How long the clip plays, in seconds. */
  duration: number;
  /** Length of the source video in seconds; null for images (any duration). */
  sourceDuration: number | null;
  /** Fill the frame (cropping) or fit inside it (letterboxing). */
  fit: "contain" | "cover";
  /** 0 to 1. Ignored for images. */
  volume: number;
}

/** A caption over the video, from `start` for `duration` seconds. */
export interface TextClip {
  id: string;
  text: string;
  start: number;
  duration: number;
  position: "top" | "center" | "bottom";
  /** Font size as a percentage of the video's height. */
  size: number;
  /** #rrggbb */
  color: string;
  /** A translucent dark box behind the text, for legibility. */
  background: boolean;
}

/** Music or a voice-over: an audio file, or the sound of a video. */
export interface AudioClip {
  id: string;
  media: MediaRef;
  start: number;
  trimStart: number;
  duration: number;
  sourceDuration: number;
  volume: number;
}

export interface Timeline {
  version: typeof TIMELINE_VERSION;
  aspect: Aspect;
  clips: VisualClip[];
  texts: TextClip[];
  audio: AudioClip[];
}

/** What the composition gets: the timeline, and a URL for each media key (see mediaKey). */
export type EditorProps = {
  timeline: Timeline;
  sources: Record<string, string>;
};

export function emptyTimeline(aspect: Aspect = "16:9"): Timeline {
  return { version: TIMELINE_VERSION, aspect, clips: [], texts: [], audio: [] };
}

/** Key of a media reference in EditorProps.sources. */
export function mediaKey(ref: MediaRef): string {
  return ref.type === "generation" ? `g:${ref.id}:${ref.index}` : `u:${ref.id}`;
}

export function toFrames(seconds: number): number {
  return Math.round(seconds * FPS);
}

/** Where each visual clip starts, in seconds from the beginning. */
export function clipStarts(timeline: Timeline): number[] {
  let at = 0;
  return timeline.clips.map((clip) => {
    const start = at;
    at += clip.duration;
    return start;
  });
}

/** Length of the whole video in seconds: the main track, or a text or audio clip that runs past it. */
export function timelineDuration(timeline: Timeline): number {
  const main = timeline.clips.reduce((sum, c) => sum + c.duration, 0);
  const texts = timeline.texts.map((t) => t.start + t.duration);
  const audio = timeline.audio.map((a) => a.start + a.duration);
  return Math.max(main, ...texts, ...audio, 0);
}

/** At least one frame, so an empty project still has a valid composition. */
export function durationInFrames(timeline: Timeline): number {
  return Math.max(1, toFrames(timelineDuration(timeline)));
}
