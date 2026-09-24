import { parseRunwareModelSchema, NormalizedRunwareModel } from "./parseRunwareSchema";
import lightricksLtx25FastSchema from "./lightricks-ltx-2-5-fast.json";
import minimaxH3Schema from "./minimax-h3.json";
import minimaxH3MaxSchema from "./minimax-h3-max.json";
import minimaxH3FastSchema from "./minimax-h3-fast.json";
import minimaxH3MaxTurboSchema from "./minimax-h3-max-turbo.json";
import bytedanceSeedance25Schema from "./bytedance-seedance-2-5.json";
import alibabaWan30Schema from "./alibaba-wan3-0.json";
import alibabaWan30PrimeSchema from "./alibaba-wan3-0-prime.json";
import bflFlux3VideoSchema from "./bfl-flux-3-video.json";
import googleGeminiOmniFlash11Schema from "./google-gemini-omni-flash-1-1.json";
import xaiGrokImagineVideo15Schema from "./xai-grok-imagine-video-1-5.json";

// 1. Individual OpenAPI model schemas registry (only models with dedicated schema files)
export const individualModelSchemas: Record<string, any> = {
  "lightricks:ltx@2.5-fast": lightricksLtx25FastSchema,
  "minimax:h3@0": minimaxH3Schema,
  "minimax:h3@max": minimaxH3MaxSchema,
  "minimax:h3@fast": minimaxH3FastSchema,
  "minimax:h3@max-turbo": minimaxH3MaxTurboSchema,
  "bytedance:seedance@2.5": bytedanceSeedance25Schema,
  "alibaba:wan@3.0": alibabaWan30Schema,
  "alibaba:wan@3.0-prime": alibabaWan30PrimeSchema,
  "bfl:flux@3-video": bflFlux3VideoSchema,
  "google:gemini@omni-flash-1.1": googleGeminiOmniFlash11Schema,
  "xai:grok-imagine@video-1.5": xaiGrokImagineVideo15Schema,
};

// 2. Normalized models parsed directly from their individual OpenAPI schema files
export const individualRunwareModels: NormalizedRunwareModel[] = [
  parseRunwareModelSchema(lightricksLtx25FastSchema),
  parseRunwareModelSchema(minimaxH3Schema),
  parseRunwareModelSchema(minimaxH3MaxSchema),
  parseRunwareModelSchema(minimaxH3FastSchema),
  parseRunwareModelSchema(minimaxH3MaxTurboSchema),
  parseRunwareModelSchema(bytedanceSeedance25Schema),
  parseRunwareModelSchema(alibabaWan30Schema),
  parseRunwareModelSchema(alibabaWan30PrimeSchema),
  parseRunwareModelSchema(bflFlux3VideoSchema),
  parseRunwareModelSchema(googleGeminiOmniFlash11Schema),
  parseRunwareModelSchema(xaiGrokImagineVideo15Schema),
];

/**
 * Returns only Runware models that have individual OpenAPI JSON schema files.
 */
export function getRunwareVideoModels(): NormalizedRunwareModel[] {
  return [...individualRunwareModels];
}

export const runwareVideoModels = getRunwareVideoModels();

/**
 * Retrieve the full input schema for a specific Runware model
 */
export function getModelInputSchema(modelKey: string): NormalizedRunwareModel["input"] | undefined {
  const model = runwareVideoModels.find(
    (m) => m.value === modelKey || m.air_id === modelKey
  );
  return model?.input;
}

/**
 * Retrieve the raw OpenAPI schema for a model if available
 */
export function getModelRawSchema(modelKey: string): any | undefined {
  return individualModelSchemas[modelKey] || runwareVideoModels.find(
    (m) => m.value === modelKey || m.air_id === modelKey
  )?.rawSchema;
}

export {
  parseRunwareModelSchema,
  lightricksLtx25FastSchema,
  minimaxH3Schema,
  minimaxH3MaxSchema,
  minimaxH3FastSchema,
  minimaxH3MaxTurboSchema,
  bytedanceSeedance25Schema,
  alibabaWan30Schema,
  alibabaWan30PrimeSchema,
  bflFlux3VideoSchema,
  googleGeminiOmniFlash11Schema,
  xaiGrokImagineVideo15Schema,
};

export type { NormalizedRunwareModel };
export default runwareVideoModels;
