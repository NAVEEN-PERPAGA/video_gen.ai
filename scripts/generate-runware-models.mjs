/**
 * Generates data/video/models/runware/*.json (the compact per-model request
 * schemas the app uses) from Runware's OpenAPI files in
 * data/video/schemas/runware_ai/.
 *
 *   node scripts/generate-runware-models.mjs
 *
 * Field definitions come straight from the OpenAPI schema. The cross-field
 * rules (`allOf` in the source) are copied verbatim into `conditions` for
 * machine validation, and described by hand in RULES below, one sentence per
 * condition — update those when a schema's `allOf` changes (the script fails
 * when the counts differ).
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = "data/video/schemas/runware_ai";
const OUT = "data/video/models/runware";

// Upscalers live in data/video/models/upscale_runware.
const SKIP = new Set([
  "bfl-flux-video-upscale.json",
  "bytedance-video-upscaler.json",
  "text_video_reference_models.json",
]);

/**
 * Published prices, per second of output video (USD), by resolution tier.
 * Runware doesn't expose a cost-estimate endpoint, so these are copied from
 * each model's docs page (https://runware.ai/docs/models/<id>) and checked
 * against the example prices in the OpenAPI files. Re-check when rates change.
 *
 * perSecond      tier -> rate; "*" = same rate at every resolution
 * videoInput     rates instead of perSecond when inputs.video is sent (edit/extend)
 * draft          rates when settings.draft is on
 * perInputImage  surcharge per input image (after `free` images) of `kinds`
 * inputVideoPerSecond  extra per second of uploaded video (length unknown up front)
 * promo          temporary discount, applied until `until` (inclusive)
 * approximate    token-billed models: rates derived from Runware's examples
 */
const CHECKED = "2026-09-24";
const PRICING = {
  "alibaba-happyhorse-1-1": { perSecond: { "720p": 0.14, "1080p": 0.18 } },
  "alibaba-wan3-0": { perSecond: { "480p": 0.05, "720p": 0.1, "1080p": 0.2 } },
  "alibaba-wan3-0-prime": { perSecond: { "480p": 0.068, "720p": 0.14, "1080p": 0.28 } },
  "bfl-flux-3-video": {
    perSecond: { "720p": 0.17, "1080p": 0.29 },
    videoInput: { "720p": 0.43, "1080p": 0.54 },
    draft: { perSecond: 0.04, videoInput: 0.06 },
    note: "Finalising a draft (draft cache) has no published price.",
  },
  "bytedance-seedance-2-5": {
    perSecond: { "480p": 0.102, "720p": 0.23, "1080p": 0.614 },
    videoInput: { "480p": 0.131, "720p": 0.295, "1080p": 0.734 },
    approximate: true,
    note: "Billed per token; per-second rates are Runware's published equivalents.",
  },
  "google-gemini-omni-flash-1-1": {
    perSecond: { "*": 0.15 },
    videoInput: { "*": 0.28 },
    approximate: true,
    note: "Billed per token ($17.50 per 1M video tokens); rate estimated from Runware's examples.",
  },
  "lightricks-ltx-2-3-fast": { perSecond: { "720p": 0.03, "1080p": 0.06, "2K": 0.12 } },
  "lightricks-ltx-2-5-fast": { perSecond: { "720p": 0.09, "1080p": 0.13, "2K": 0.19, "4K": 0.3 } },
  "minimax-h3": {
    perSecond: { "768p": 0.08, "1440p": 0.13 },
    perInputImage: { price: 0.04, free: 5, kinds: ["referenceImages"] },
    inputVideoPerSecond: 0.13,
  },
  "minimax-h3-fast": { perSecond: { "*": 0.046 } },
  "minimax-h3-max": {
    perSecond: { "480p": 0.05, "768p": 0.08 },
    promo: { factor: 0.5, until: "2026-09-30", label: "50% off until 30 Sep" },
  },
  "minimax-h3-max-turbo": {
    perSecond: { "480p": 0.025, "768p": 0.04 },
    promo: { factor: 0.5, until: "2026-09-30", label: "50% off until 30 Sep" },
  },
  "xai-grok-imagine-video-1-5": {
    perSecond: { "480p": 0.08, "720p": 0.14, "1080p": 0.25 },
    perInputImage: { price: 0.01, free: 0, kinds: ["frameImages", "referenceImages"] },
  },
};

// One entry per `allOf` condition, in the same order, so a failed condition
// can be reported with its sentence (see lib/runware/request.ts).
const PAIR = "Width and height must be sent together.";
const PRESET = "Width × height must be one of the supported sizes.";
const RES_XOR = "Choose either a resolution preset or an exact size, not both.";

const RULES = {
  "alibaba-happyhorse-1-1": [
    PAIR,
    "Text-to-video (no frame or reference images) needs an exact size.",
    RES_XOR,
    "With a first frame, use a resolution preset instead of an exact size.",
    PRESET,
    "A resolution preset needs a frame or reference image to match.",
    "Enter a prompt, or add a first frame.",
  ],
  "alibaba-wan3-0": [
    PAIR,
    "Without frame images, reference images or reference videos, pick an exact size.",
    "Frame images can't be combined with reference images, videos or audios.",
    RES_XOR,
    "Use either a document or a URL, not both.",
    "A resolution preset needs a frame image, reference image or reference video to match.",
    "Enter a prompt, or add a frame image or reference media.",
    PRESET,
  ],
  "alibaba-wan3-0-prime": [
    PAIR,
    "Without frame images, reference images or reference videos, pick an exact size.",
    "Frame images can't be combined with reference images, videos or audios.",
    RES_XOR,
    "Use either a document or a URL, not both.",
    "A resolution preset needs a frame image, reference image or reference video to match.",
    "Enter a prompt, or add a frame image or reference media.",
    PRESET,
  ],
  "bfl-flux-3-video": [
    PAIR,
    "Frame images and an input video can't be used together.",
    RES_XOR,
    "When finalising a draft (draft cache), don't send a prompt, duration, size, frame images, video, audio or draft settings.",
    "Enter a prompt, or add a draft cache to finalise.",
    "With 3 or more frame images, pick a duration in seconds.",
    "With frame images or a video, safety tolerance is at most 2.",
    PRESET,
  ],
  "bytedance-seedance-2-5": [
    PAIR,
    "Frame images can't be combined with reference images, reference videos or an input video.",
    RES_XOR,
    "With frame images or an input video, use a resolution preset instead of an exact size.",
    "Enter a prompt, or add frame images or reference media.",
    "Edit/extend operations need an input video.",
    "When editing a video, duration must be Auto.",
    PRESET,
  ],
  "google-gemini-omni-flash-1-1": [
    PAIR,
    "Frame images can't be combined with reference images, reference videos or an input video.",
    "An input video can't be combined with reference images or reference videos.",
    RES_XOR,
    "With an input video, don't pick an exact size.",
    PRESET,
  ],
  "lightricks-ltx-2-3-fast": [PAIR],
  "lightricks-ltx-2-5-fast": [
    PAIR,
    "Frame images and audio can't be used together.",
    "With audio, don't set duration or camera movement: the video follows the audio's length.",
    "Audio needs a reference image.",
    "A reference image is only used together with audio.",
    "With audio, the size must be 1080p (1920×1080 or 1080×1920).",
    "At 48 or 50 fps, duration is at most 10s.",
    "At 2K or 4K, duration is at most 10s.",
    PRESET,
  ],
  "minimax-h3": [
    PAIR,
    "Frame images can't be combined with reference images, videos or audios.",
    RES_XOR,
    "With frame images, use a resolution preset instead of an exact size.",
    "A resolution preset needs a frame image, reference image or reference video.",
    PRESET,
    "Reference audio needs a reference image or reference video.",
  ],
  "minimax-h3-fast": [
    PAIR,
    "Frame images can't be combined with reference images, videos or audios.",
    "With frame images, choose Auto size (it follows the image).",
    "Reference audio needs a reference image or reference video.",
    PRESET,
  ],
  "minimax-h3-max": [
    PAIR,
    RES_XOR,
    "With frame images, use a resolution preset instead of an exact size.",
    "A resolution preset needs a frame image.",
    PRESET,
  ],
  "minimax-h3-max-turbo": [
    PAIR,
    RES_XOR,
    "With frame images, use a resolution preset instead of an exact size.",
    "A resolution preset needs a frame image.",
    PRESET,
  ],
  "xai-grok-imagine-video-1-5": [
    PAIR,
    "Without a first frame, pick an exact size.",
    "A first frame and reference images can't be used together.",
    RES_XOR,
    PRESET,
    "A resolution preset needs a first frame.",
  ],
};

// Keys copied as-is from a property definition, in output order.
const PASSTHROUGH = [
  "type", "const", "enum", "default", "minimum", "maximum", "exclusiveMinimum",
  "exclusiveMaximum", "multipleOf", "minLength", "maxLength", "minItems", "maxItems",
];
// Keys dropped on purpose (documentation or covered by `rules`/`conditions`).
const DROPPED = new Set([
  "title", "$id", "additionalProperties", "contains", "dependentSchemas", "pattern", "examples",
  "x-order",
]);
const unknownKeys = new Set();

/** First paragraph of a description, without the trailing docs link. */
function shortDescription(text) {
  if (!text) return undefined;
  return text
    .split(/\n\s*\n/)[0]
    .replace(/\s*\[Read full documentation\]\([^)]*\)/, "")
    .trim();
}

/**
 * Field-level constraints that don't survive simplification, turned into
 * sentences. Throws on an unknown shape so a new rule is never dropped silently.
 */
function constraintNotes(node) {
  const notes = [];
  const lastOnly = node.contains?.not?.properties?.frame?.enum;
  if (lastOnly) {
    if (String(lastOnly) !== "last,-1") throw new Error(`Unknown contains: ${JSON.stringify(node.contains)}`);
    notes.push("Must include at least one image that is not the last frame.");
  }
  if (node.dependentSchemas) {
    const forbidden = node.dependentSchemas.frame?.not?.required;
    if (Object.keys(node.dependentSchemas).length !== 1 || String(forbidden) !== "timestamp") {
      throw new Error(`Unknown dependentSchemas: ${JSON.stringify(node.dependentSchemas)}`);
    }
    notes.push("Use either frame or timestamp, not both.");
  }
  return notes;
}

const isConstBranch = (b) => b && "const" in b;
const isEnumish = (b) => b && ("const" in b || "enum" in b) && !b.properties;

function simplify(node) {
  if (typeof node !== "object" || node === null) return node;
  const out = {};

  for (const key of PASSTHROUGH) if (key in node) out[key] = node[key];

  // A plain string/uri/uuid field: the format alternatives (uuid | uri |
  // data URI | base64) are explained by the description instead.
  if (node.format && !node.anyOf) out.format = node.format;

  if (node.oneOf) {
    if (node.oneOf.every(isConstBranch)) {
      // Choice list with per-option help, e.g. camera movements.
      out.oneOf = node.oneOf.map((b) => ({
        const: b.const,
        ...(b.description && { description: b.description }),
      }));
    } else if (node.oneOf.every(isEnumish)) {
      // e.g. duration: integer enum | "auto" -> one flat enum.
      out.enum = node.oneOf.flatMap((b) => ("enum" in b ? b.enum : [b.const]));
    } else {
      out.oneOf = node.oneOf.map(simplify);
    }
  }

  if (node.anyOf) {
    const formatOnly = node.anyOf.every((b) => Object.keys(b).every((k) => k === "format" || k === "pattern"));
    if (!formatOnly) out.anyOf = node.anyOf.map(simplify);
  }

  const notes = [shortDescription(node.description), ...constraintNotes(node)].filter(Boolean);
  if (notes.length) out.description = notes.join(" ");

  if (node.items) out.items = simplify(node.items);
  if (node.properties) {
    out.properties = Object.fromEntries(
      Object.entries(node.properties).map(([k, v]) => [k, simplify(v)]),
    );
  }
  if (node.required) out.required = node.required;

  for (const key of Object.keys(node)) {
    if (
      !PASSTHROUGH.includes(key) &&
      !DROPPED.has(key) &&
      !["format", "oneOf", "anyOf", "description", "items", "properties", "required"].includes(key)
    ) {
      unknownKeys.add(key);
    }
  }
  return out;
}

/** Strips titles/ids from the raw `allOf` so it stays readable but exact. */
function stripDocs(node) {
  if (Array.isArray(node)) return node.map(stripDocs);
  if (typeof node !== "object" || node === null) return node;
  return Object.fromEntries(
    Object.entries(node)
      .filter(([k]) => k !== "$id" && !(k === "title" && typeof node[k] === "string"))
      .map(([k, v]) => [k, stripDocs(v)]),
  );
}

function aspect(w, h) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const g = gcd(w, h);
  const [a, b] = [w / g, h / g];
  // Near-standard ratios (e.g. 1920x1088) read better rounded.
  const known = [[16, 9], [9, 16], [4, 3], [3, 4], [1, 1], [21, 9], [9, 21], [3, 2], [2, 3]];
  const close = known.find(([x, y]) => Math.abs(w / h - x / y) < 0.03);
  return close ? `${close[0]}:${close[1]}` : a <= 32 && b <= 32 ? `${a}:${b}` : (w / h).toFixed(2);
}

/**
 * Width/height presets from the `if width|height then oneOf [...]` rule. Some
 * models have narrower preset rules for one mode (e.g. LTX audio-driven is
 * 1080p only), so take the largest list.
 */
function extractResolutions(allOf = []) {
  const presetLists = allOf
    .map((rule) => rule.then?.oneOf)
    .filter((branches) => branches?.every((b) => b.properties?.width?.const && b.properties?.height?.const))
    .sort((a, b) => b.length - a.length);
  if (presetLists.length === 0) return undefined;
  return presetLists[0].map((b) => {
    const width = b.properties.width.const;
    const height = b.properties.height.const;
    return { label: b.title ?? `${width}×${height} (${aspect(width, height)})`, width, height };
  });
}

// Order fields the way a request is usually read: identity, prompt, media
// shape, inputs, settings, then delivery options.
const FIELD_ORDER = [
  "model", "taskType", "taskUUID", "positivePrompt", "width", "height", "resolution",
  "duration", "fps", "seed", "numberResults", "speech", "lora", "settings", "inputs", "safety",
];

function convert(file) {
  const doc = JSON.parse(readFileSync(join(SRC, file), "utf8"));
  const info = doc.info;
  const body = doc.components.schemas.RequestBody;
  const task = body.items ?? body;
  const id = info["x-model-id"];

  const props = Object.entries(task.properties);
  props.sort(([a], [b]) => {
    const ia = FIELD_ORDER.indexOf(a);
    const ib = FIELD_ORDER.indexOf(b);
    return (ia === -1 ? FIELD_ORDER.length : ia) - (ib === -1 ? FIELD_ORDER.length : ib);
  });

  const conditions = stripDocs(task.allOf ?? []);
  if (!PRICING[id]) console.warn(`! ${id}: no pricing`);
  const rules = RULES[id];
  if (rules?.length !== conditions.length) {
    throw new Error(
      `${id}: ${conditions.length} conditions but ${rules?.length ?? 0} rules. Update RULES to match allOf.`,
    );
  }

  const model = {
    name: info.title.replace(/^Runware API - /, ""),
    organisation: info["x-creator"]?.name,
    provider: "runware",
    value: info["x-air-id"],
    air_id: info["x-air-id"],
    href: `/models/video/${info["x-creator"]?.id}/${id}`,
    paid: true,
    type: "video",
    capabilities: info["x-capabilities"].filter((c) => c !== "checkpoint"),
    description: info.description,
    schema: `https://runware.ai/docs/models/${id}`,
    ...(extractResolutions(task.allOf) && { resolutions: extractResolutions(task.allOf) }),
    ...(PRICING[id] && {
      pricing: { ...PRICING[id], source: `https://runware.ai/docs/models/${id}`, checked: CHECKED },
    }),
    required: task.required ?? [],
    rules,
    conditions,
    input: Object.fromEntries(props.map(([k, v]) => [k, simplify(v)])),
  };

  writeFileSync(join(OUT, `${id}.json`), `${JSON.stringify(model, null, 2)}\n`);
  return { id, conditions: conditions.length };
}

const results = readdirSync(SRC)
  .filter((f) => f.endsWith(".json") && !SKIP.has(f))
  .map(convert);

for (const r of results) console.log(`${r.id}: ${r.conditions} conditions`);
if (unknownKeys.size) console.warn(`! dropped unrecognised keys: ${[...unknownKeys].join(", ")}`);
