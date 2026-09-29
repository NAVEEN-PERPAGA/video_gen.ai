import type { VideoModel } from "./models";
import { type AssetKind, assetKinds, type ComposerValues } from "./request";

/**
 * Prompt tags for reference media. Runware doesn't parse them: the model reads
 * the prompt text and matches "image 1" to the first `inputs.referenceImages`
 * entry, and so on. Each media type is numbered on its own, from one, in array
 * order — so removing an attachment shifts every tag after it.
 *
 * The spelling is per model. Seedance documents `@Image1`; Wan and MiniMax use
 * `Image 1` (the MiniMax guides do, though its schema doesn't say), which also
 * reads as plain language for models that document nothing.
 * Frame images are placed by their `frame` position, never tagged.
 */

export type TagStyle = "at" | "word";
export type TagMedia = "image" | "video" | "audio";

const NOUNS: Record<TagMedia, string> = { image: "Image", video: "Video", audio: "Audio" };
const MEDIA_OF_NOUN: Record<string, TagMedia> = { image: "image", video: "video", audio: "audio" };

export function tagStyle(model: VideoModel): TagStyle {
  return model.input.positivePrompt?.description?.includes("@Image1") ? "at" : "word";
}

/** The reference arrays a prompt can point into (not frame images or single inputs). */
export function taggableKinds(model: VideoModel): (AssetKind & { media: TagMedia })[] {
  return assetKinds(model).filter(
    (k): k is AssetKind & { media: TagMedia } => k.key.startsWith("reference") && k.media in NOUNS,
  );
}

/** "@Image2" or "Image 2" for the second item. */
export function tagFor(style: TagStyle, media: TagMedia, n: number) {
  return style === "at" ? `@${NOUNS[media]}${n}` : `${NOUNS[media]} ${n}`;
}

/**
 * Matches tags in a style. `@` tags are unambiguous, so any case counts; word
 * tags must be capitalised so "a video 2 seconds long" isn't taken for one.
 */
function tagPattern(style: TagStyle) {
  return style === "at" ? /@(image|video|audio)(\d+)\b/gi : /\b(Image|Video|Audio) (\d+)\b/g;
}

function mapTags(prompt: string, style: TagStyle, fn: (media: TagMedia, n: number, tag: string) => string) {
  return prompt.replace(tagPattern(style), (tag, noun: string, n: string) =>
    fn(MEDIA_OF_NOUN[noun.toLowerCase()], Number(n), tag),
  );
}

export interface PromptTag {
  media: TagMedia;
  n: number;
  text: string;
  start: number;
  end: number;
}

export function findTags(prompt: string, style: TagStyle): PromptTag[] {
  return [...prompt.matchAll(tagPattern(style))].map((m) => ({
    media: MEDIA_OF_NOUN[m[1].toLowerCase()],
    n: Number(m[2]),
    text: m[0],
    start: m.index,
    end: m.index + m[0].length,
  }));
}

/** Drops tags for the `n`th item of a type and shifts the later ones down. */
export function removeTag(prompt: string, style: TagStyle, media: TagMedia, n: number) {
  const removed = mapTags(prompt, style, (m, i, tag) =>
    m !== media || i < n ? tag : i === n ? "\u0000" : tagFor(style, m, i - 1),
  );
  // Take the space before a dropped tag with it, so no double spaces are left.
  return removed.replace(/ ?\u0000/g, "");
}

/** Rewrites every tag into the next model's spelling (kept as-is if it takes no references). */
export function convertTags(prompt: string, from: VideoModel, to: VideoModel) {
  if (taggableKinds(from).length === 0 || taggableKinds(to).length === 0) return prompt;
  const [a, b] = [tagStyle(from), tagStyle(to)];
  return a === b ? prompt : mapTags(prompt, a, (media, n) => tagFor(b, media, n));
}

/** Keeps tags pointing at the same files after attachments are removed. */
export function retagAfterRemoval(
  model: VideoModel,
  prompt: string,
  before: ComposerValues["assets"],
  after: ComposerValues["assets"],
) {
  const style = tagStyle(model);
  let next = prompt;
  for (const kind of taggableKinds(model)) {
    const kept = new Set((after[kind.key] ?? []).map((i) => i.id));
    const old = before[kind.key] ?? [];
    // From the end, so earlier positions are still right when their turn comes.
    for (let i = old.length - 1; i >= 0; i--) {
      if (!kept.has(old[i].id)) next = removeTag(next, style, kind.media, i + 1);
    }
  }
  return next;
}

/** Tags that point at nothing: the model silently drops the clause holding them. */
export function tagProblems(model: VideoModel, values: ComposerValues): string[] {
  const kinds = taggableKinds(model);
  // Without references, "Video 1" is just prose; a leftover "@Image1" is still a tag.
  const style = kinds.length > 0 ? tagStyle(model) : "at";
  const problems = new Set<string>();
  for (const tag of findTags(values.prompt, style)) {
    const kind = kinds.find((k) => k.media === tag.media);
    const count = kind ? (values.assets[kind.key] ?? []).length : 0;
    if (tag.n >= 1 && tag.n <= count) continue;
    problems.add(
      kind
        ? `${tag.text} has no ${tag.media} to point to (${count} attached) — the model will ignore it.`
        : `${model.name} doesn't take reference ${tag.media}s, so ${tag.text} will be ignored.`,
    );
  }
  return [...problems];
}

/** A tag in the middle of being typed: "@" plus whatever follows it up to the caret. */
export function tagQueryAt(prompt: string, caret: number) {
  const match = /(^|\s)@([a-z]*\d*)$/i.exec(prompt.slice(0, caret));
  if (!match) return null;
  return { start: caret - match[2].length - 1, query: match[2].toLowerCase() };
}
