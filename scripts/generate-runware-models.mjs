/**
 * Generates data/video/models/runware/*.json (the compact per-model request
 * schemas the app uses) from Runware's OpenAPI files in
 * data/video/schemas/runware_ai/. See scripts/runware-schema.mjs.
 *
 *   node scripts/generate-runware-models.mjs
 */
import { generate, PAIR, PRESET, RES_XOR } from "./runware-schema.mjs";

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
    // Google's per-second equivalents (720p = 5,792 video tokens/s at $17.50 per 1M).
    perSecond: { "360p": 0.03, "720p": 0.1, "1080p": 0.15, "4K": 0.3 },
    // Edit/extend: ~$0.28/s at 1080p from Runware's examples, scaled by the same tier ratios.
    videoInput: { "360p": 0.056, "720p": 0.187, "1080p": 0.28, "4K": 0.56 },
    approximate: true,
    note: "Billed per token ($17.50 per 1M video tokens); input tokens add a little on top.",
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

// Order fields the way a request is usually read: identity, prompt, media
// shape, inputs, settings, then delivery options.
const FIELD_ORDER = [
  "model", "taskType", "taskUUID", "positivePrompt", "width", "height", "resolution",
  "duration", "fps", "seed", "numberResults", "speech", "lora", "settings", "inputs", "safety",
];

generate({ src: SRC, out: OUT, type: "video", skip: SKIP, pricing: PRICING, checked: CHECKED, rules: RULES, fieldOrder: FIELD_ORDER });
