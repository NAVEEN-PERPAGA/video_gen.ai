import type { StaticImageData } from "next/image";
import type { ModelPricing } from "./pricing";
import runwareModels from "@/data/video/models/runware";
import alibabaLogo from "@/assets/icons/alibaba.svg";
import bflLogo from "@/assets/icons/blackForestLabs.png";
import bytedanceLogo from "@/assets/icons/bytedance.svg";
import googleLogo from "@/assets/icons/google.svg";
import lightricksLogo from "@/assets/icons/lightricks.png";
import minimaxLogo from "@/assets/icons/minimax.svg";
import xLogo from "@/assets/icons/x.svg";

/** The subset of JSON Schema used by data/video/models/runware/*.json. */
export interface FieldSchema {
  type?: string | string[];
  const?: unknown;
  enum?: unknown[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  format?: string;
  description?: string;
  oneOf?: FieldSchema[];
  anyOf?: FieldSchema[];
  items?: FieldSchema;
  properties?: Record<string, FieldSchema>;
  required?: string[];
}

export interface VideoModel {
  name: string;
  organisation: string;
  value: string;
  href: string;
  capabilities: string[];
  description: string;
  schema: string;
  resolutions?: { label: string; width: number; height: number }[];
  pricing?: ModelPricing;
  required: string[];
  rules: string[];
  conditions: object[];
  input: Record<string, FieldSchema>;
}

export const videoModels = runwareModels as unknown as VideoModel[];

export const defaultModelId = "google:gemini@omni-flash-1.1";

export function getVideoModel(id: string) {
  return videoModels.find((m) => m.value === id);
}

/**
 * Organisation logos from /assets/icons. `tile` is the background the logo is
 * drawn for: Lightricks and BFL ship white marks and X is black, so they sit
 * on a dark tile in both themes.
 */
export const organisationLogos: Record<string, { src: StaticImageData; tile: "light" | "dark"; invert?: boolean }> = {
  Alibaba: { src: alibabaLogo, tile: "light" },
  "Black Forest Labs": { src: bflLogo, tile: "dark" },
  ByteDance: { src: bytedanceLogo, tile: "light" },
  Google: { src: googleLogo, tile: "light" },
  Lightricks: { src: lightricksLogo, tile: "dark" },
  MiniMax: { src: minimaxLogo, tile: "light" },
  xAI: { src: xLogo, tile: "dark", invert: true },
};

/** Models grouped by organisation, in first-seen order. */
export function modelsByOrganisation() {
  const groups = new Map<string, VideoModel[]>();
  for (const model of videoModels) {
    groups.set(model.organisation, [...(groups.get(model.organisation) ?? []), model]);
  }
  return [...groups.entries()];
}
