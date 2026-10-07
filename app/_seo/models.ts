import { type RunwareModel, videoModels } from "@/lib/runware/models";

/**
 * Model facts for the landing copy, read from data/video/models so the
 * comparison table and the cost answers stay true when a model file changes.
 */
export interface ModelSpec {
  name: string;
  maker: string;
  /** Longest clip in one generation, in seconds. */
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

function maxSeconds(model: RunwareModel): number | null {
  const d = model.input.duration;
  if (!d) return null;
  const options = [d, ...(d.oneOf ?? [])];
  const values = options.flatMap((o) => [o.maximum, ...(o.enum ?? [])]).filter((n) => typeof n === "number");
  return values.length > 0 ? Math.max(...values) : null;
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
  name: m.name,
  maker: m.organisation,
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
