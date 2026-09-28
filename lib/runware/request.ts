import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import type { FieldSchema, VideoModel } from "./models";

/**
 * Turns composer values into a Runware `videoInference` task for any model in
 * data/video/models/runware, and checks it against that model's schema —
 * including its cross-field `conditions`, reported with the matching `rules`
 * sentence. Runs in the browser for live hints and on the server for real.
 */

export type MediaKind = "image" | "video" | "audio" | "document" | "link" | "text";

export interface AssetKind {
  /** Key under `inputs`, e.g. "frameImages". */
  key: string;
  label: string;
  media: MediaKind;
  /** Array inputs take several items; string inputs take one. */
  max: number;
  /** Named positions a frame image can be pinned to (empty = not supported). */
  framePositions: string[];
  /** File-picker `accept` list when a local file can be sent inline; unset = URL/UUID only. */
  accept?: string;
}

export interface AssetItem {
  id: string;
  value: string;
  /** Frame position for frame images; unset lets the API distribute them. */
  frame?: string;
  /** Original file name when attached from the device (value is then a data URI, or an upload's URL). */
  name?: string;
  /** Local blob: URL to preview a file from the device (the uploaded copy may be slow to fetch). */
  preview?: string;
  /** Workspace upload id of a file stored in R2; the server re-signs its URL when generating. */
  uploadId?: number;
  /** Share of the file sent so far (0–1) while uploading. */
  progress?: number;
  /** Why the upload failed. */
  uploadError?: string;
}

/** Whether an item is a file still on its way to storage. */
export function isUploading(item: AssetItem) {
  return item.progress !== undefined && item.uploadError === undefined;
}

export interface ComposerValues {
  prompt: string;
  /** "auto" (send nothing) | "preset:1920x1080" | "res:720p" | "custom". */
  size: string;
  customWidth: number;
  customHeight: number;
  duration?: number | "auto";
  fps?: number;
  numberResults: number;
  seed?: number;
  settings: Record<string, boolean | string | number | undefined>;
  assets: Record<string, AssetItem[]>;
  voices: string[];
  lora: { model: string; weight: number }[];
  outputFormat?: string;
  outputQuality?: number;
  checkContent: boolean;
  safetyMode?: string;
}

export type RunwareTask = Record<string, unknown>;

const ASSET_LABELS: Record<string, string> = {
  frameImages: "Frame image",
  referenceImages: "Reference image",
  referenceVideos: "Reference video",
  referenceAudios: "Reference audio",
  video: "Input video",
  audio: "Audio",
  documents: "Document",
  urls: "Web page",
  draftCache: "Draft cache",
};

/**
 * File types uploaded to workspace storage (node_scalable MEDIA_TYPES) and
 * sent to Runware as a URL. The API also stores GIF and AVIF images, but
 * video models expect PNG, JPEG or WebP, so only those are offered.
 */
export const UPLOAD_TYPES: Partial<Record<MediaKind, string[]>> = {
  video: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-matroska",
    "video/ogg",
    "video/mpeg",
    "video/x-msvideo",
    "video/3gpp",
  ],
  image: ["image/png", "image/jpeg", "image/webp"],
};

/**
 * Images and videos upload to workspace storage. Documents go inline
 * (base64), as do images when there's no workspace to upload to (signed
 * out). Audio must already be hosted, so it stays URL/UUID only.
 */
const FILE_ACCEPT: Partial<Record<MediaKind, string>> = {
  image: UPLOAD_TYPES.image!.join(","),
  video: UPLOAD_TYPES.video!.join(","),
  document: ".pdf,.txt,.md,.doc,.docx",
};

/** Largest single file read inline into the request (documents, or images when signed out). */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
/** Inline files ride in the server action body (limit set in next.config.ts). */
const MAX_INLINE_CHARS = 45 * 1024 * 1024;

export function humanize(key: string) {
  const words = key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return words[0].toUpperCase() + words.slice(1);
}

function mediaOf(key: string): MediaKind {
  if (/image/i.test(key)) return "image";
  if (/video/i.test(key)) return "video";
  if (/audio/i.test(key)) return "audio";
  if (key === "documents") return "document";
  if (key === "urls") return "link";
  return "text";
}

/** String values an option list allows: `enum`, or `oneOf` consts/enums. */
export function choices(field: FieldSchema | undefined): unknown[] {
  if (!field) return [];
  if (field.enum) return field.enum;
  return (field.oneOf ?? []).flatMap((b) => (b.enum ? b.enum : "const" in b ? [b.const] : []));
}

function framePositions(field: FieldSchema): string[] {
  const object = field.items?.anyOf?.find((b) => b.type === "object");
  const frame = object?.properties?.frame;
  if (!frame) return [];
  const named = choices(frame).filter((c): c is string => typeof c === "string");
  // Some schemas only say "a named position"; first/last are the documented ones.
  return named.length > 0 ? named : ["first", "last"];
}

export function assetKinds(model: VideoModel): AssetKind[] {
  const props = model.input.inputs?.properties ?? {};
  return Object.entries(props).map(([key, field]) => ({
    key,
    label: ASSET_LABELS[key] ?? humanize(key),
    media: mediaOf(key),
    max: field.type === "array" ? (field.maxItems ?? 10) : 1,
    framePositions: key === "frameImages" ? framePositions(field) : [],
    accept: FILE_ACCEPT[mediaOf(key)],
  }));
}

/** "30 reference images", "1 input video". */
export function assetLimit(kind: AssetKind) {
  return `${kind.max} ${kind.label.toLowerCase()}${kind.max === 1 ? "" : "s"}`;
}

/** Range fields (e.g. duration 3–15) become a list of whole-number options. */
export function numberOptions(field: FieldSchema | undefined): (number | "auto")[] {
  if (!field) return [];
  const listed = choices(field).filter((c): c is number | "auto" => typeof c === "number" || c === "auto");
  if (field.enum) return listed;
  const range = field.oneOf?.find((b) => b.minimum !== undefined) ?? field;
  const options: (number | "auto")[] = [];
  if (range.minimum !== undefined && range.maximum !== undefined) {
    for (let n = Math.ceil(range.minimum); n <= range.maximum; n++) options.push(n);
  }
  return [...options, ...listed.filter((c) => !options.includes(c))];
}

/** Common frame rates inside a free fps range (LTX-2.3 takes 1–120). */
export function fpsOptions(field: FieldSchema | undefined): number[] {
  if (!field) return [];
  if (field.enum) return field.enum as number[];
  return [24, 25, 30, 48, 50, 60].filter((f) => f >= (field.minimum ?? 1) && f <= (field.maximum ?? 120));
}

export interface SizeOption {
  value: string;
  label: string;
  group: string;
}

/** Every size choice a model offers, in the order they're tried by `autoAdjust`. */
export function sizeOptions(model: VideoModel): SizeOption[] {
  const input = model.input;
  const options: SizeOption[] = [];
  for (const r of choices(input.resolution)) {
    options.push({ value: `res:${r}`, label: String(r), group: "Resolution · follows input aspect" });
  }
  if (!model.required.includes("width")) {
    options.push({ value: "auto", label: "Auto", group: "Resolution · follows input aspect" });
  }
  for (const r of model.resolutions ?? []) {
    options.push({ value: `preset:${r.width}x${r.height}`, label: r.label, group: "Exact size" });
  }
  if (input.width?.minimum !== undefined) options.push({ value: "custom", label: "Custom size", group: "Exact size" });
  return options;
}

/** A landscape ~16:9 preset around 1080p, the usual starting point. */
function defaultPreset(model: VideoModel) {
  const presets = model.resolutions ?? [];
  const input = model.input;
  const byDefault = presets.find((r) => r.width === input.width?.default && r.height === input.height?.default);
  if (byDefault) return byDefault;
  const score = (r: { width: number; height: number }) =>
    Math.abs(r.width / r.height - 16 / 9) * 10 + Math.abs(r.height - 1080) / 1080;
  return [...presets].sort((a, b) => score(a) - score(b))[0];
}

export function initialValues(model: VideoModel): ComposerValues {
  const input = model.input;
  const preset = defaultPreset(model);
  let size = "auto";
  if (preset) size = `preset:${preset.width}x${preset.height}`;
  else if (input.resolution) size = `res:${input.resolution.default ?? choices(input.resolution)[0]}`;
  else if (input.width?.minimum !== undefined) size = "custom";

  const durationField = input.duration;
  const durationRequired = model.required.includes("duration");
  const durationDefault = durationField?.default as number | "auto" | undefined;

  return {
    prompt: "",
    size,
    customWidth: 1024,
    customHeight: 576,
    duration: durationRequired ? (durationDefault ?? numberOptions(durationField).find((d) => d === 5) ?? 5) : undefined,
    numberResults: 1,
    settings: {},
    assets: {},
    voices: [],
    lora: [],
    checkContent: false,
  };
}

/** Builds the task object, sending only what the user set and the model accepts. */
export function buildTask(model: VideoModel, v: ComposerValues, taskUUID: string): RunwareTask {
  const input = model.input;
  const task: RunwareTask = {
    taskType: input.taskType?.const ?? "videoInference",
    taskUUID,
    model: model.value,
  };
  const set = (key: string, value: unknown) => {
    if (value !== undefined && value !== "" && key in input) task[key] = value;
  };

  set("positivePrompt", v.prompt.trim() || undefined);

  if (v.size.startsWith("preset:")) {
    const [width, height] = v.size.slice(7).split("x").map(Number);
    set("width", width);
    set("height", height);
  } else if (v.size.startsWith("res:")) {
    set("resolution", v.size.slice(4));
  } else if (v.size === "custom") {
    set("width", v.customWidth);
    set("height", v.customHeight);
  }

  set("duration", v.duration);
  set("fps", v.fps);
  set("seed", v.seed);
  set("numberResults", v.numberResults);

  const settings = Object.fromEntries(Object.entries(v.settings).filter(([, value]) => value !== undefined));
  if (Object.keys(settings).length > 0) set("settings", settings);

  const inputs: Record<string, unknown> = {};
  for (const kind of assetKinds(model)) {
    const items = (v.assets[kind.key] ?? []).filter((i) => i.value.trim());
    if (items.length === 0) continue;
    const field = input.inputs!.properties![kind.key];
    // Documents take plain base64 rather than a data URI.
    const value = (i: AssetItem) =>
      kind.media === "document" ? i.value.trim().replace(/^data:[^,]*;base64,/, "") : i.value.trim();
    inputs[kind.key] =
      field.type === "array"
        ? items.map((i) => (i.frame ? { image: value(i), frame: i.frame } : value(i)))
        : value(items[0]);
  }
  if (Object.keys(inputs).length > 0) set("inputs", inputs);

  if (v.voices.length > 0) set("speech", { voices: v.voices });
  const lora = v.lora.filter((l) => l.model.trim()).map((l) => ({ model: l.model.trim(), weight: l.weight }));
  if (lora.length > 0) set("lora", lora);
  if (v.checkContent) set("safety", { checkContent: true, ...(v.safetyMode && { mode: v.safetyMode }) });

  set("outputType", input.outputType?.default);
  set("outputFormat", v.outputFormat);
  set("outputQuality", v.outputQuality);
  set("deliveryMethod", input.deliveryMethod?.default ?? "async");
  return task;
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validators = new Map<string, ValidateFunction>();

function validatorFor(model: VideoModel) {
  let validate = validators.get(model.value);
  if (!validate) {
    validate = ajv.compile({
      type: "object",
      properties: model.input,
      required: model.required,
      allOf: model.conditions,
      additionalProperties: false,
    });
    validators.set(model.value, validate);
  }
  return validate;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUrl(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function assetProblems(model: VideoModel, v: ComposerValues) {
  const problems: string[] = [];
  let inlineChars = 0;
  for (const kind of assetKinds(model)) {
    for (const item of v.assets[kind.key] ?? []) {
      if (item.uploadError !== undefined) {
        problems.push(`${item.name ?? kind.label} failed to upload. Remove it and try again.`);
        continue;
      }
      if (isUploading(item)) {
        problems.push(`Wait for ${item.name ?? "the file"} to finish uploading.`);
        continue;
      }
      const value = item.value.trim();
      const inline = value.startsWith("data:");
      if (inline) inlineChars += value.length;
      // Images and documents also accept attached files; draft caches are opaque ids from a previous run.
      const ok =
        kind.media === "text" ||
        isUrl(value) ||
        (kind.media !== "link" && UUID_RE.test(value)) ||
        (kind.media === "image" && value.startsWith("data:image/")) ||
        (kind.media === "document" && inline);
      if (!ok) problems.push(`${kind.label} must be a URL${kind.media === "link" ? "" : " or a Runware UUID"}.`);
    }
  }
  if (inlineChars > MAX_INLINE_CHARS) {
    problems.push("Attached files are too large in total — remove some or attach them by URL.");
  }
  return problems;
}

const FIELD_LABELS: Record<string, string> = { positivePrompt: "Prompt" };

function fieldLabel(path: string) {
  const key = path.split("/").filter((p) => p && !/^\d+$/.test(p)).pop() ?? "request";
  return FIELD_LABELS[key] ?? humanize(key);
}

function describe(model: VideoModel, e: ErrorObject): string {
  const rule = e.schemaPath.match(/^#\/allOf\/(\d+)\//);
  if (rule) return model.rules[Number(rule[1])];
  if (e.keyword === "required" && e.schemaPath === "#/required") {
    const missing = String(e.params.missingProperty);
    return missing === "positivePrompt" ? "Enter a prompt." : `${fieldLabel(missing)} is required.`;
  }
  const label = fieldLabel(e.instancePath);
  if (e.keyword === "minLength") return `${label} must be at least ${e.params.limit} characters.`;
  if (e.keyword === "maxLength") return `${label} must be ${e.params.limit} characters or fewer.`;
  if (e.keyword === "maxItems") return `${label}: at most ${e.params.limit} allowed.`;
  return `${label} ${e.message}.`;
}

const PLACEHOLDER_UUID = "00000000-0000-4000-8000-000000000000";

/** Validates values as they'd be sent (with a placeholder task UUID). */
export function checkValues(model: VideoModel, v: ComposerValues) {
  return validateTask(model, v, buildTask(model, v, PLACEHOLDER_UUID));
}

/**
 * After attachments change, the chosen size or duration can become invalid
 * (e.g. most models want a resolution preset, not an exact size, once a first
 * frame sets the aspect). Picks the size — and drops an optional duration —
 * that leaves the fewest problems, keeping the current choice on a tie.
 */
export function autoAdjust(model: VideoModel, v: ComposerValues): ComposerValues {
  let best = v;
  let bestCount = checkValues(model, v).length;
  if (bestCount === 0) return v;

  // Try the model's default resolution before the other presets.
  const defaultRes = `res:${model.input.resolution?.default}`;
  const sizes = sizeOptions(model)
    .map((o) => o.value)
    .sort((a, b) => Number(b === defaultRes) - Number(a === defaultRes));
  const candidates: ComposerValues[] = sizes.map((size) => ({ ...v, size }));
  if (v.duration !== undefined && !model.required.includes("duration")) {
    candidates.push(...candidates.map((c) => ({ ...c, duration: undefined })), { ...v, duration: undefined });
  }
  for (const candidate of candidates) {
    const count = checkValues(model, candidate).length;
    if (count < bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

/** All problems with the request, as user-facing sentences (empty = valid). */
export function validateTask(model: VideoModel, v: ComposerValues, task: RunwareTask): string[] {
  const validate = validatorFor(model);
  validate(task);
  const messages = new Set(assetProblems(model, v));
  // A failing anyOf/oneOf also reports every branch; one line per field is enough.
  const seenPaths = new Set<string>();
  for (const e of validate.errors ?? []) {
    const inRule = e.schemaPath.startsWith("#/allOf/");
    if (!inRule && e.instancePath && seenPaths.has(e.instancePath)) continue;
    if (!inRule) seenPaths.add(e.instancePath);
    messages.add(describe(model, e));
  }
  return [...messages];
}
