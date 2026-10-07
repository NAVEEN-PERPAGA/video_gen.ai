/**
 * Generates data/image/models/runware/*.json (the compact per-model request
 * schemas the app uses) from Runware's OpenAPI files in
 * data/image/schemas/runware/. See scripts/runware-schema.mjs.
 *
 *   node scripts/generate-runware-image-models.mjs
 */
import { generate, PAIR, PRESET, RES_XOR } from "./runware-schema.mjs";

const SRC = "data/image/schemas/runware";
const OUT = "data/image/models/runware";

/**
 * Published prices, per generated image (USD). Taken from each schema's
 * `x-pricing` block and the model's docs page (https://runware.ai/docs/models/<id>).
 * Re-check when rates change.
 *
 * perImage       tier -> price per image; tiers match the model's `resolution`
 *                values, "*" = same price at every size
 * perInputImage  surcharge per input image (after `free` images) of `kinds`
 * approximate    token- or step-billed models: prices from Runware's examples
 */
const CHECKED = "2026-09-30";
const PRICING = {
  "bfl-flux-2-klein-9b": {
    perImage: { "*": 0.00078 },
    approximate: true,
    note: "Priced at 1024×1024 with 4 steps; larger sizes, more steps and reference images cost more.",
  },
  "bfl-flux-3-image": { perImage: { "0.75K": 0.041, "1K": 0.048, "2K": 0.1, "4K": 0.607 } },
  "google-nano-banana-2": {
    perImage: { "0.5K": 0.04657, "1K": 0.06895, "2K": 0.10255, "4K": 0.15295 },
    perInputImage: { price: 0.00028, free: 0, kinds: ["referenceImages"] },
    note: "Grounded search adds $0.14.",
  },
  "google-nano-banana-2-1": {
    perImage: { "1K": 0.0341, "2K": 0.0524, "4K": 0.0756 },
    approximate: true,
    note: "Billed per token ($30 per 1M image output tokens); reference inputs and grounded search cost more.",
  },
  "google-nano-banana-2-lite": {
    perImage: { "1K": 0.0336 },
    approximate: true,
    note: "Billed per token ($30 per 1M image output tokens); input tokens add a little on top.",
  },
  "meta-muse-image": { perImage: { "*": 0.01 } },
  "openai-gpt-image-2-5-flare": {
    perImage: { "*": 0.0431 },
    approximate: true,
    note: "Billed per token ($30 per 1M image output tokens); varies with size and quality.",
  },
  "openai-gpt-image-2-5-sunburst": {
    perImage: { "*": 0.167 },
    approximate: true,
    note: "Billed per token ($30 per 1M image output tokens); varies with size and quality.",
  },
  "xai-grok-imagine-image-2-0": {
    perImage: { "1K": 0.04, "2K": 0.06 },
    perInputImage: { price: 0.01, free: 0, kinds: ["referenceImages"] },
    note: "Low quality; medium quality adds $0.02.",
  },
};

// One entry per `allOf` condition, in the same order, so a failed condition
// can be reported with its sentence (see lib/runware/request.ts).
const PRESET_NEEDS_REFERENCE = "A resolution preset needs a reference image.";
const SIZE_WITHOUT_REFERENCE = "Without reference images, pick an exact size.";
const GPT_IMAGE = [
  PAIR,
  "A transparent background needs PNG or WEBP output.",
  "A mask image needs a reference image.",
];

const RULES = {
  "bfl-flux-2-klein-9b": [PAIR, "Use either acceleration or accelerator options, not both."],
  "bfl-flux-3-image": [
    PAIR,
    RES_XOR,
    PRESET,
    PRESET_NEEDS_REFERENCE,
    "Without reference images, bounding boxes can only set a target box.",
  ],
  "google-nano-banana-2": [PAIR, RES_XOR, PRESET, PRESET_NEEDS_REFERENCE],
  "google-nano-banana-2-1": [PAIR, RES_XOR, PRESET, PRESET_NEEDS_REFERENCE],
  "google-nano-banana-2-lite": [PAIR, SIZE_WITHOUT_REFERENCE, RES_XOR, PRESET, PRESET_NEEDS_REFERENCE],
  "meta-muse-image": [PAIR, RES_XOR, PRESET_NEEDS_REFERENCE, PRESET],
  "openai-gpt-image-2-5-flare": GPT_IMAGE,
  "openai-gpt-image-2-5-sunburst": GPT_IMAGE,
  "xai-grok-imagine-image-2-0": [PAIR, SIZE_WITHOUT_REFERENCE, RES_XOR, PRESET, PRESET_NEEDS_REFERENCE],
};

// Order fields the way a request is usually read: identity, prompt, image
// shape, sampling, inputs, settings, then delivery options.
const FIELD_ORDER = [
  "model", "taskType", "taskUUID", "positivePrompt", "negativePrompt", "width", "height", "resolution",
  "seed", "numberResults", "steps", "CFGScale", "scheduler", "lora", "settings", "inputs", "safety",
];

generate({ src: SRC, out: OUT, type: "image", pricing: PRICING, checked: CHECKED, rules: RULES, fieldOrder: FIELD_ORDER });
