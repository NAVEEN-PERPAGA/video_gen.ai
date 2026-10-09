/**
 * Edits to a Timeline: pure functions that return a new timeline (or item),
 * so the editor can keep an undo history and the API sees whole timelines.
 * Times are seconds, snapped to whole frames.
 */
import {
  type AudioClip,
  clipStarts,
  FPS,
  LIMITS,
  type MediaRef,
  type TextClip,
  type Timeline,
  timelineDuration,
  type VisualClip,
} from "./timeline";

/** What's selected on the timeline: an item of one of its three tracks. */
export type Selection = { track: "clips" | "texts" | "audio"; id: string } | null;
export type Track = NonNullable<Selection>["track"];

const MIN = LIMITS.minClipSeconds;

/** Rounds to the nearest frame, so stored times line up with what renders. */
export function snap(seconds: number): number {
  return Math.round(seconds * FPS) / FPS;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function newId(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 12);
}

/** Whether the timeline fits the editor's limits (the API rejects it otherwise). */
export function withinLimits(timeline: Timeline): boolean {
  return (
    timelineDuration(timeline) <= LIMITS.durationSeconds + 0.01 &&
    timeline.clips.length <= LIMITS.clips &&
    timeline.texts.length <= LIMITS.texts &&
    timeline.audio.length <= LIMITS.audio
  );
}

export function findItem(timeline: Timeline, selection: Selection) {
  if (!selection) return null;
  return (timeline[selection.track] as { id: string }[]).find((item) => item.id === selection.id) ?? null;
}

/** The visual clip on screen at `time`, with its index and start. */
export function clipAt(timeline: Timeline, time: number) {
  const starts = clipStarts(timeline);
  const index = timeline.clips.findIndex((c, i) => time >= starts[i] && time < starts[i] + c.duration);
  return index === -1 ? null : { index, clip: timeline.clips[index], start: starts[index] };
}

// --- Adding -----------------------------------------------------------------------------

/** How much longer the main track may get. */
export function roomLeft(timeline: Timeline): number {
  return LIMITS.durationSeconds - timeline.clips.reduce((sum, c) => sum + c.duration, 0);
}

/** A video clip using as much of the source as fits in `room` seconds. */
export function videoClip(media: MediaRef, sourceDuration: number, room: number = LIMITS.durationSeconds): VisualClip {
  return {
    id: newId(),
    kind: "video",
    media,
    trimStart: 0,
    duration: snap(Math.min(sourceDuration, room)),
    sourceDuration,
    fit: "contain",
    volume: 1,
  };
}

export function imageClip(media: MediaRef, room: number = LIMITS.durationSeconds): VisualClip {
  return {
    id: newId(),
    kind: "image",
    media,
    trimStart: 0,
    duration: snap(Math.min(LIMITS.defaultStillSeconds, room)),
    sourceDuration: null,
    fit: "contain",
    volume: 1,
  };
}

export function textClip(start: number): TextClip {
  return {
    id: newId(),
    text: "Your text",
    start: snap(start),
    duration: LIMITS.defaultStillSeconds,
    position: "bottom",
    size: 6,
    color: "#ffffff",
    background: false,
  };
}

/** An audio clip from `start`, cut off where the video's maximum length ends. */
export function audioClip(media: MediaRef, sourceDuration: number, start: number): AudioClip {
  return {
    id: newId(),
    media,
    start: snap(start),
    trimStart: 0,
    duration: snap(Math.min(sourceDuration, LIMITS.durationSeconds - start)),
    sourceDuration,
    volume: 1,
  };
}

/** Adds an item to the end of its track (the main track plays in order, so that's last). */
export function addItem(timeline: Timeline, track: Track, item: VisualClip | TextClip | AudioClip): Timeline {
  return { ...timeline, [track]: [...timeline[track], item] };
}

// --- Changing ---------------------------------------------------------------------------

export function updateItem<T extends { id: string }>(
  timeline: Timeline,
  track: Track,
  id: string,
  patch: Partial<T>,
): Timeline {
  return {
    ...timeline,
    [track]: (timeline[track] as unknown as T[]).map((item) => (item.id === id ? { ...item, ...patch } : item)),
  };
}

export function removeItem(timeline: Timeline, selection: Selection): Timeline {
  if (!selection) return timeline;
  return {
    ...timeline,
    [selection.track]: (timeline[selection.track] as { id: string }[]).filter((item) => item.id !== selection.id),
  };
}

/** Moves the main track's clip at `from` so it ends up at index `to`. */
export function moveClip(timeline: Timeline, from: number, to: number): Timeline {
  if (from === to) return timeline;
  const clips = [...timeline.clips];
  const [clip] = clips.splice(from, 1);
  clips.splice(to, 0, clip);
  return { ...timeline, clips };
}

/**
 * A visual clip with one edge dragged by `delta` seconds, from how it was
 * when the drag started. Video clips can't reach past their source's ends.
 */
export function trimVisual(clip: VisualClip, edge: "start" | "end", delta: number): VisualClip {
  const max = clip.sourceDuration ?? LIMITS.durationSeconds;
  if (edge === "end") {
    return { ...clip, duration: snap(clamp(clip.duration + delta, MIN, max - clip.trimStart)) };
  }
  if (clip.kind === "image") return { ...clip, duration: snap(clamp(clip.duration - delta, MIN, max)) };
  const shift = snap(clamp(delta, -clip.trimStart, clip.duration - MIN));
  return { ...clip, trimStart: snap(clip.trimStart + shift), duration: snap(clip.duration - shift) };
}

/** A text or audio clip with an edge dragged by `delta` seconds (audio can't reach past its file's ends). */
export function trimSpan<T extends TextClip | AudioClip>(item: T, edge: "start" | "end", delta: number): T {
  const audio = isAudio(item) ? item : null;
  if (edge === "end") {
    const max = audio ? audio.sourceDuration - audio.trimStart : LIMITS.durationSeconds;
    return { ...item, duration: snap(clamp(item.duration + delta, MIN, max)) };
  }
  const shift = snap(clamp(delta, -Math.min(item.start, audio ? audio.trimStart : Infinity), item.duration - MIN));
  return {
    ...item,
    start: snap(item.start + shift),
    duration: snap(item.duration - shift),
    ...(audio && { trimStart: snap(audio.trimStart + shift) }),
  };
}

function isAudio(item: TextClip | AudioClip): item is AudioClip {
  return "media" in item;
}

/** A text or audio clip moved by `delta` seconds (never before 0). */
export function moveSpan<T extends TextClip | AudioClip>(item: T, delta: number): T {
  return { ...item, start: snap(Math.max(0, item.start + delta)) };
}

/**
 * Splits at `time`: the selected text or audio clip if the time falls inside
 * it, otherwise the main track's clip there. Returns null if there's nothing
 * to split (or a part would be shorter than the minimum).
 */
export function splitAt(timeline: Timeline, selection: Selection, time: number): Timeline | null {
  const at = snap(time);
  if (selection && selection.track !== "clips") {
    const items = timeline[selection.track] as (TextClip | AudioClip)[];
    const index = items.findIndex((i) => i.id === selection.id);
    const item = items[index];
    if (item) {
      const offset = at - item.start;
      if (offset < MIN || item.duration - offset < MIN) return null;
      const second = {
        ...item,
        id: newId(),
        start: at,
        duration: snap(item.duration - offset),
        ...(isAudio(item) && { trimStart: snap(item.trimStart + offset) }),
      };
      const next = [...items];
      next.splice(index, 1, { ...item, duration: snap(offset) }, second);
      return { ...timeline, [selection.track]: next };
    }
  }

  const hit = clipAt(timeline, at);
  if (!hit) return null;
  const offset = snap(at - hit.start);
  if (offset < MIN || hit.clip.duration - offset < MIN) return null;
  const first = { ...hit.clip, duration: offset };
  const second: VisualClip = {
    ...hit.clip,
    id: newId(),
    trimStart: hit.clip.kind === "video" ? snap(hit.clip.trimStart + offset) : 0,
    duration: snap(hit.clip.duration - offset),
  };
  const clips = [...timeline.clips];
  clips.splice(hit.index, 1, first, second);
  return { ...timeline, clips };
}
