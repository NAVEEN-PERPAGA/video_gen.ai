import type { VideoModel } from "./models";
import type { ComposerValues } from "./request";

/**
 * Live cost estimate from the `pricing` block in each model file (published
 * per-second rates by resolution tier). Runware only reports the real cost
 * after a task runs, so this is an estimate by design.
 */

export interface ModelPricing {
  perSecond: Record<string, number>;
  videoInput?: Record<string, number>;
  draft?: { perSecond: number; videoInput?: number };
  perInputImage?: { price: number; free: number; kinds: string[] };
  inputVideoPerSecond?: number;
  promo?: { factor: number; until: string; label: string };
  approximate?: boolean;
  note?: string;
  source: string;
  checked: string;
}

export interface CostEstimate {
  /** Total in USD, or a [low, high] range when the tier isn't known yet. */
  total?: number | [number, number];
  /** Rate per second, shown when the length isn't known up front. */
  perSecond?: number | [number, number];
  /** Pre-discount total, when a promo applies. */
  original?: number | [number, number];
  approximate: boolean;
  /** One line per factor, for the tooltip. */
  breakdown: string[];
  notes: string[];
  promo?: string;
}

/** Output pixels per tier; a size is billed at the first tier that covers it. */
const TIER_PIXELS: Record<string, number> = {
  "360p": 640 * 360,
  "480p": 854 * 480,
  "720p": 1280 * 720,
  "768p": 1344 * 768,
  "1080p": 1920 * 1080,
  "1440p": 2560 * 1440,
  "2K": 2560 * 1440,
  "4K": 3840 * 2160,
};

function tierForPixels(rates: Record<string, number>, pixels: number) {
  const tiers = Object.keys(rates).sort((a, b) => TIER_PIXELS[a] - TIER_PIXELS[b]);
  return tiers.find((t) => pixels <= TIER_PIXELS[t]) ?? tiers[tiers.length - 1];
}

/** The tier the chosen size is billed at, or null when it follows the input. */
function billedTier(model: VideoModel, v: ComposerValues, rates: Record<string, number>): string | null {
  if ("*" in rates) return "*";
  if (v.size.startsWith("res:")) {
    const res = v.size.slice(4);
    return res in rates ? res : tierForPixels(rates, TIER_PIXELS[res] ?? 0);
  }
  if (v.size.startsWith("preset:")) {
    const [w, h] = v.size.slice(7).split("x").map(Number);
    // Presets are billed at the tier they're labelled with: Seedance's "480p (~4:3)"
    // is 752×560, a few more pixels than 854×480, but still charged as 480p.
    const labelTier = model.resolutions?.find((r) => r.width === w && r.height === h)?.label.split(" ")[0];
    return labelTier && labelTier in rates ? labelTier : tierForPixels(rates, w * h);
  }
  if (v.size === "custom") return tierForPixels(rates, v.customWidth * v.customHeight);
  // "Auto": the API falls back to the model's default resolution, if it has one.
  const fallback = model.input.resolution?.default;
  return typeof fallback === "string" ? (fallback in rates ? fallback : tierForPixels(rates, TIER_PIXELS[fallback] ?? 0)) : null;
}

const money = (n: number) => `$${n < 1 ? n.toFixed(3).replace(/0$/, "") : n.toFixed(2)}`;

export function formatCost(value: number | [number, number]) {
  return Array.isArray(value)
    ? value[0] === value[1]
      ? money(value[0])
      : `${money(value[0])}–${money(value[1])}`
    : money(value);
}

function promoActive(promo: ModelPricing["promo"], now: Date) {
  // Inclusive of the whole `until` day, in the viewer's time zone.
  return promo !== undefined && now <= new Date(`${promo.until}T23:59:59`);
}

export function estimateCost(model: VideoModel, v: ComposerValues, now = new Date()): CostEstimate | null {
  const pricing = model.pricing;
  if (!pricing) return null;

  const notes = pricing.note ? [pricing.note] : [];
  const breakdown: string[] = [];
  const count = (key: string) => (v.assets[key] ?? []).filter((a) => a.value.trim()).length;

  if (count("draftCache") > 0) {
    return { approximate: true, breakdown, notes: ["Finalising a draft has no published price."] };
  }

  // Which rate table applies: draft preview, video input (edit/extend), or normal.
  const hasVideoInput = count("video") > 0;
  const draft = v.settings.draft === true && pricing.draft;
  let rates: Record<string, number>;
  if (draft) {
    rates = { "*": hasVideoInput ? (pricing.draft!.videoInput ?? pricing.draft!.perSecond) : pricing.draft!.perSecond };
    breakdown.push(hasVideoInput ? "Draft preview, video input" : "Draft preview");
  } else if (hasVideoInput && pricing.videoInput) {
    rates = pricing.videoInput;
    breakdown.push("Video input rate");
  } else {
    rates = pricing.perSecond;
  }

  const tier = billedTier(model, v, rates);
  const tierRates = tier ? [rates[tier]] : Object.values(rates);
  const rate: [number, number] = [Math.min(...tierRates), Math.max(...tierRates)];
  if (tier && tier !== "*") breakdown.push(`${tier} tier`);
  else if (!tier) notes.push("Size follows the input, so the price depends on its resolution.");

  // Length in seconds; unknown for "auto" or when it follows an audio input.
  const followsAudio = count("audio") > 0 && model.value.startsWith("lightricks:ltx@2.5");
  const duration = v.duration ?? (model.input.duration?.default as number | "auto" | undefined);
  const seconds = typeof duration === "number" && !followsAudio ? duration : null;
  if (seconds === null) notes.push(followsAudio ? "Length follows the audio." : "Length is chosen by the model.");

  // Per-image surcharges.
  let extras = 0;
  if (pricing.perInputImage) {
    const images = pricing.perInputImage.kinds.reduce((n, k) => n + count(k), 0);
    const billed = Math.max(0, images - pricing.perInputImage.free);
    if (billed > 0) {
      extras += billed * pricing.perInputImage.price;
      breakdown.push(`${billed} input image${billed > 1 ? "s" : ""} × ${money(pricing.perInputImage.price)}`);
    }
  }
  if (pricing.inputVideoPerSecond && (count("referenceVideos") > 0 || hasVideoInput)) {
    notes.push(`Plus ${money(pricing.inputVideoPerSecond)} per second of input video.`);
  }

  const results = v.numberResults || 1;
  const factor = promoActive(pricing.promo, now) ? pricing.promo!.factor : 1;
  const scale = ([lo, hi]: [number, number], f: number): [number, number] => [lo * f, hi * f];
  const collapse = (r: [number, number]) => (r[0] === r[1] ? r[0] : r);

  breakdown.unshift(`${formatCost(collapse(scale(rate, factor)))}/s`);
  if (seconds !== null) breakdown.push(`${seconds}s`);
  if (results > 1) breakdown.push(`${results} videos`);

  const estimate: CostEstimate = {
    approximate: pricing.approximate ?? false,
    breakdown,
    notes,
    ...(factor !== 1 && { promo: pricing.promo!.label }),
  };

  if (seconds === null) {
    estimate.perSecond = collapse(scale(rate, factor));
    return estimate;
  }
  const total = (f: number): [number, number] => [
    (rate[0] * seconds * f + extras) * results,
    (rate[1] * seconds * f + extras) * results,
  ];
  estimate.total = collapse(total(factor));
  if (factor !== 1) estimate.original = collapse(total(1));
  return estimate;
}
