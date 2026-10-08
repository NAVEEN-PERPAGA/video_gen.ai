import { type RunwareModel, videoModels } from "@/lib/runware/models";

/**
 * Model facts for the landing copy, read from data/video/models so the
 * comparison table and the cost answers stay true when a model file changes.
 */
export interface ModelSpec {
  /** The model's AIR id, e.g. "bytedance:seedance@2.5". */
  id: string;
  name: string;
  maker: string;
  /** Shortest and longest clip in one generation, in seconds. */
  minSeconds: number | null;
  maxSeconds: number | null;
  /** Highest output tier, e.g. "1080p" or "4K". */
  maxResolution: string | null;
  inputs: string[];
  /** Cheapest published rate, USD per second. */
  fromPerSecond: number | null;
}

const INPUTS: [capability: string, label: string][] = [
  ["text-to-video", "Text"],
  ["image-to-video", "Image"],
  ["video-to-video", "Video"],
  ["audio-to-video", "Audio"],
];

function durations(model: RunwareModel): number[] {
  const d = model.input.duration;
  if (!d) return [];
  const options = [d, ...(d.oneOf ?? [])];
  return options.flatMap((o) => [o.minimum, o.maximum, ...(o.enum ?? [])]).filter((n) => typeof n === "number");
}

function maxSeconds(model: RunwareModel): number | null {
  const values = durations(model);
  return values.length > 0 ? Math.max(...values) : null;
}

function minSeconds(model: RunwareModel): number | null {
  const values = durations(model);
  return values.length > 0 ? Math.min(...values) : null;
}

/** "4K" and "2K" by their pixel height, "720p" by its number. */
function tierHeight(label: string): number {
  if (/^4K/i.test(label)) return 2160;
  if (/^2K/i.test(label)) return 1440;
  return Number(/^(\d+)p/.exec(label)?.[1] ?? 0);
}

function maxResolution(model: RunwareModel): string | null {
  const labels = [
    ...(model.resolutions ?? []).map((r) => r.label),
    ...Object.keys(model.pricing?.perSecond ?? {}),
  ];
  const best = labels.filter((l) => tierHeight(l) > 0).sort((a, b) => tierHeight(b) - tierHeight(a))[0];
  return best ? /^(\d+p|[24]K)/i.exec(best)![1] : null;
}

function fromPerSecond(model: RunwareModel): number | null {
  const rates = Object.values(model.pricing?.perSecond ?? {});
  return rates.length > 0 ? Math.min(...rates) : null;
}

export const modelSpecs: ModelSpec[] = videoModels.map((m) => ({
  id: m.value,
  name: m.name,
  maker: m.organisation,
  minSeconds: minSeconds(m),
  maxSeconds: maxSeconds(m),
  maxResolution: maxResolution(m),
  inputs: INPUTS.filter(([c]) => m.capabilities.includes(c)).map(([, label]) => label),
  fromPerSecond: fromPerSecond(m),
}));

/** The lowest per-second rate across all video models. */
export const cheapestPerSecond = Math.min(...modelSpecs.flatMap((s) => (s.fromPerSecond === null ? [] : [s.fromPerSecond])));

export function usd(n: number) {
  return `$${n < 1 ? n.toFixed(3).replace(/0$/, "") : n.toFixed(2)}`;
}

/** A video model by its AIR id; throws so a renamed model fails the build instead of a page. */
export function videoModel(id: string): RunwareModel {
  const model = videoModels.find((m) => m.value === id);
  if (!model) throw new Error(`Unknown video model ${id}`);
  return model;
}

/** Published price per second of output at one tier ("*" rates apply to every tier). */
export function perSecond(id: string, tier: string): number {
  const rates = videoModel(id).pricing?.perSecond ?? {};
  const rate = rates[tier] ?? rates["*"];
  if (rate === undefined) throw new Error(`No ${tier} price for ${id}`);
  return rate;
}

/** The model's output tiers, lowest first, with their per-second rates. */
export function priceTiers(model: RunwareModel): { tier: string; perSecond: number }[] {
  const rates = model.pricing?.perSecond ?? {};
  const fromSizes = (model.resolutions ?? []).map((r) => /^(\d+p|[24]K)/i.exec(r.label)?.[1]).filter((t) => t !== undefined);
  const tiers = [...new Set(fromSizes.length > 0 ? fromSizes : Object.keys(rates).filter((t) => t !== "*"))];
  return tiers
    .sort((a, b) => tierHeight(a) - tierHeight(b))
    .flatMap((tier) => {
      const rate = rates[tier] ?? rates["*"];
      return rate === undefined ? [] : [{ tier, perSecond: rate }];
    });
}

/** Aspect ratios from the size presets, e.g. ["16:9", "9:16"]; empty when the model takes any size. */
export function aspectRatios(model: RunwareModel): string[] {
  const ratios = (model.resolutions ?? []).map((r) => /\(~?([\d:]+)\)/.exec(r.label)?.[1]).filter((r) => r !== undefined);
  return [...new Set(ratios)];
}
