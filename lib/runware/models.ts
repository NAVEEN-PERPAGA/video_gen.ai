import type { StaticImageData } from "next/image";
import type { ModelPricing } from "./pricing";
import runwareImageModels from "@/data/image/models/runware";
import runwareModels from "@/data/video/models/runware";
import alibabaLogo from "@/assets/icons/alibaba.svg";
import bflLogo from "@/assets/icons/blackForestLabs.png";
import bytedanceLogo from "@/assets/icons/bytedance.svg";
import googleLogo from "@/assets/icons/google.svg";
import lightricksLogo from "@/assets/icons/lightricks.png";
import minimaxLogo from "@/assets/icons/minimax.svg";
import openaiLogo from "@/assets/icons/openai.svg";
import xLogo from "@/assets/icons/x.svg";

/** The subset of JSON Schema used by data/{video,image}/models/runware/*.json. */
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

/** What a model generates; also picks the API endpoint (POST .../generations/{video,image}). */
export type MediaType = "video" | "image";

export interface RunwareModel {
  name: string;
  organisation: string;
  value: string;
  href: string;
  type: MediaType;
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

export const videoModels = runwareModels as unknown as RunwareModel[];
export const imageModels = runwareImageModels as unknown as RunwareModel[];
const allModels = [...videoModels, ...imageModels];

/** The model each mode opens with. */
export const defaultModelIds: Record<MediaType, string> = {
  video: "google:gemini@omni-flash-1.1",
  image: "google:4@3",
};

/** A video or image model by its AIR id. */
export function getModel(id: string) {
  return allModels.find((m) => m.value === id);
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
  OpenAI: { src: openaiLogo, tile: "dark" },
  xAI: { src: xLogo, tile: "dark", invert: true },
};

/** `type`'s models grouped by organisation, in first-seen order. */
export function modelsByOrganisation(type: MediaType) {
  const groups = new Map<string, RunwareModel[]>();
  for (const model of type === "image" ? imageModels : videoModels) {
    groups.set(model.organisation, [...(groups.get(model.organisation) ?? []), model]);
  }
  return [...groups.entries()];
}
