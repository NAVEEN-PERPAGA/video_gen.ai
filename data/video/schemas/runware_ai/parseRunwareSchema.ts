export interface RunwareModelPricingExample {
  configuration?: string;
  price?: string;
  latencyMs?: number;
  exampleId?: string;
}

export interface RunwarePricingInfo {
  overview?: string;
  examples?: RunwareModelPricingExample[];
}

export interface CameraMovementOption {
  value: string;
  label: string;
  description?: string;
}

export interface NormalizedRunwareModel {
  name: string;
  organisation: string;
  provider: "runware";
  value: string;
  air_id: string;
  href: string;
  paid: boolean;
  type: string;
  description: string;
  schema?: string;
  rawSchema: any;
  supportedResolutions: string[];
  supportedDurations: number[];
  cost: Array<{ resolution: string; cost: number }>;
  max_frame_image_Attachments: number;
  max_reference_image_Attachments: number;
  max_reference_video_Attachments: number;
  max_reference_audio_Attachments: number;
  input: {
    positivePrompt: {
      type: string;
      required: boolean;
      description?: string;
      minLength?: number;
      maxLength?: number;
    };
    duration: {
      type: string;
      default: number;
      enum?: number[];
      minimum?: number;
      maximum?: number;
      description?: string;
    };
    resolution: {
      type: string;
      default: string;
      enum?: string[];
      description?: string;
    };
    aspect_ratio: {
      type: string;
      default: string;
      enum?: string[];
      description?: string;
    };
    width?: {
      type: string;
      default?: number;
      description?: string;
    };
    height?: {
      type: string;
      default?: number;
      description?: string;
    };
    fps?: {
      type: string;
      default?: number;
      enum?: number[];
      minimum?: number;
      maximum?: number;
      description?: string;
    };
    inputs: {
      frameImages?: {
        type: string;
        maxItems?: number;
        minItems?: number;
        description?: string;
      };
      referenceImages?: {
        type: string;
        maxItems?: number;
        minItems?: number;
        description?: string;
      };
      referenceVideos?: {
        type: string;
        maxItems?: number;
        description?: string;
      };
      referenceAudios?: {
        type: string;
        maxItems?: number;
        description?: string;
      };
      audio?: {
        type: string;
        description?: string;
      };
      video?: {
        type: string;
        description?: string;
      };
    };
    settings?: {
      audio?: {
        type: string;
        default?: boolean;
        description?: string;
      };
      cameraMovement?: {
        type: string;
        enum?: string[];
        options?: CameraMovementOption[];
        description?: string;
      };
      enhancePrompt?: {
        type: string;
        default?: boolean;
        description?: string;
      };
      operation?: {
        type: string;
        enum?: string[];
        description?: string;
      };
    };
    outputFormat?: {
      type: string;
      default: string;
      enum: string[];
      description?: string;
    };
    outputQuality?: {
      type: string;
      default: number;
      minimum: number;
      maximum: number;
      description?: string;
    };
    numberResults?: {
      type: string;
      default: number;
      minimum: number;
      maximum: number;
      description?: string;
    };
    safety?: any;
    seed?: any;
  };
}

/**
 * Format a camera movement code (e.g. 'dolly_in') into a user-friendly label (e.g. 'Dolly In')
 */
function formatLabel(val: string): string {
  return val
    .split(/[_\-\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Determine resolution tag (e.g. 720p, 1080p, 2k, 4k) from width and height
 */
function getResolutionTag(w: number, h: number): string {
  const minDim = Math.min(w, h);
  const maxDim = Math.max(w, h);
  if (minDim >= 2160 || maxDim >= 3840) return "4k";
  if (minDim >= 1440 || maxDim >= 2560) return "2k";
  if (minDim >= 1080 || maxDim >= 1920) return "1080p";
  if (minDim >= 720 || maxDim >= 1280) return "720p";
  return "480p";
}

/**
 * Determine aspect ratio string (e.g. '16:9', '9:16', '1:1') from width and height
 */
function getAspectRatio(w: number, h: number): string {
  const ratio = w / h;
  if (Math.abs(ratio - 16 / 9) < 0.05) return "16:9";
  if (Math.abs(ratio - 9 / 16) < 0.05) return "9:16";
  if (Math.abs(ratio - 1) < 0.05) return "1:1";
  if (Math.abs(ratio - 4 / 3) < 0.05) return "4:3";
  if (Math.abs(ratio - 3 / 4) < 0.05) return "3:4";
  if (Math.abs(ratio - 21 / 9) < 0.05) return "21:9";
  return `${w}:${h}`;
}

/**
 * Parses an individual Runware OpenAPI / JSON schema (e.g. lightricks-ltx-2-5-fast.json)
 * into a NormalizedRunwareModel for workflow input consumption.
 */
export function parseRunwareModelSchema(schema: any): NormalizedRunwareModel {
  if (!schema) {
    throw new Error("Cannot parse null or undefined schema");
  }

  const info = schema.info || {};
  const requestBodySchema = schema.components?.schemas?.RequestBody?.items || {};
  const props = requestBodySchema.properties || {};
  const allOf = requestBodySchema.allOf || [];

  // 1. Identity & Metadata
  const airId =
    info["x-air-id"] ||
    props.model?.const ||
    info["x-model-id"] ||
    "runware:unknown-model";
  const modelId = info["x-model-id"] || airId.replace(/[:@]/g, "-");
  const creatorName =
    info["x-creator"]?.name ||
    (airId.includes(":") ? airId.split(":")[0] : "Runware");
  const creatorId = info["x-creator"]?.id || creatorName.toLowerCase();
  const rawTitle = info.title || "";
  const name =
    rawTitle.replace(/^Runware API\s*[-–—]\s*/i, "").trim() ||
    info.summary ||
    modelId;
  const description = info.summary || info.description || "";
  const href = `/models/video/${creatorId}/${modelId}`;

  // 2. Durations
  const durationProp = props.duration || {};
  let supportedDurations: number[] = [];
  if (Array.isArray(durationProp.enum)) {
    supportedDurations = durationProp.enum.filter((v: any) => typeof v === "number");
  } else if (Array.isArray(durationProp.oneOf)) {
    for (const opt of durationProp.oneOf) {
      if (Array.isArray(opt.enum)) {
        supportedDurations = opt.enum.filter((v: any) => typeof v === "number");
        break;
      } else if (typeof opt.minimum === "number" && typeof opt.maximum === "number") {
        for (let i = opt.minimum; i <= opt.maximum; i += (opt.multipleOf || 1)) {
          supportedDurations.push(i);
        }
        break;
      }
    }
  } else if (typeof durationProp.minimum === "number" && typeof durationProp.maximum === "number") {
    for (let i = durationProp.minimum; i <= durationProp.maximum; i += (durationProp.multipleOf || 1)) {
      supportedDurations.push(i);
    }
  }
  if (supportedDurations.length === 0) {
    supportedDurations = [6, 8, 10, 12, 14, 16, 18, 20];
  }
  const defaultDuration =
    typeof durationProp.default === "number" ? durationProp.default : supportedDurations[0] || 6;

  // 3. Resolutions & Aspect Ratios (scanned from allOf conditional rules)
  const supportedResolutionsSet = new Set<string>();
  const resolutionPresetSet = new Set<string>();
  const aspectPresetSet = new Set<string>();

  function processResolutionBlock(oneOfList: any[]) {
    for (const item of oneOfList) {
      const w = item.properties?.width?.const ?? item.properties?.width?.default;
      const h = item.properties?.height?.const ?? item.properties?.height?.default;
      if (typeof w === "number" && typeof h === "number") {
        let resTag = "";
        let aspectTag = "";

        if (item.title) {
          const match = item.title.match(/^([^\s(]+)\s*\(([^)]+)\)/);
          if (match) {
            resTag = match[1].toLowerCase();
            aspectTag = match[2].replace(/^~/, "").trim();
          }
        }
        if (!resTag) resTag = getResolutionTag(w, h);
        if (!aspectTag) aspectTag = getAspectRatio(w, h);

        const formatted = `${aspectTag}_${w}_${h}_${resTag}`;
        supportedResolutionsSet.add(formatted);
        resolutionPresetSet.add(resTag);
        aspectPresetSet.add(aspectTag);
      }
    }
  }

  // Traverse allOf conditions to extract oneOf resolution matrices
  for (const cond of allOf) {
    if (Array.isArray(cond.then?.oneOf)) {
      processResolutionBlock(cond.then.oneOf);
    } else if (Array.isArray(cond.oneOf)) {
      processResolutionBlock(cond.oneOf);
    }
  }

  // Include any resolution presets explicitly declared in properties.resolution.enum
  if (Array.isArray(props.resolution?.enum)) {
    for (const r of props.resolution.enum) {
      if (typeof r === "string") {
        resolutionPresetSet.add(r.toLowerCase());
      }
    }
  }

  // Fallback defaults if no resolution block found in allOf
  if (supportedResolutionsSet.size === 0) {
    const defaultResList = [
      "16:9_1280_720_720p",
      "9:16_720_1280_720p",
      "16:9_1920_1080_1080p",
      "9:16_1080_1920_1080p",
      "16:9_2560_1440_2k",
      "9:16_1440_2560_2k",
      "16:9_3840_2160_4k",
      "9:16_2160_3840_4k",
    ];
    defaultResList.forEach((r) => {
      supportedResolutionsSet.add(r);
      const parts = r.split("_");
      aspectPresetSet.add(parts[0]);
      resolutionPresetSet.add(parts[3]);
    });
  }

  const supportedResolutions = Array.from(supportedResolutionsSet);
  const resolutionOptions = Array.from(resolutionPresetSet);
  const aspectRatioOptions = Array.from(aspectPresetSet);

  // 4. Inputs (referenceImages, frameImages, audio, video)
  const inputsProp = props.inputs?.properties || {};
  const maxRefImages = inputsProp.referenceImages?.maxItems ?? (inputsProp.referenceImages ? 1 : 0);
  const maxFrameImages = inputsProp.frameImages?.maxItems ?? (inputsProp.frameImages ? 2 : 0);
  const maxRefVideos = inputsProp.referenceVideos?.maxItems ?? (inputsProp.video ? 1 : 0);
  const maxRefAudios = inputsProp.referenceAudios?.maxItems ?? (inputsProp.audio ? 1 : 0);

  // 5. Settings (audio, cameraMovement, enhancePrompt)
  const settingsProp = props.settings?.properties || {};
  let cameraMovementOptions: CameraMovementOption[] = [];
  let cameraMovementEnum: string[] = [];

  const cmProp = settingsProp.cameraMovement;
  if (cmProp) {
    if (Array.isArray(cmProp.oneOf)) {
      cameraMovementOptions = cmProp.oneOf.map((opt: any) => ({
        value: opt.const,
        label: formatLabel(opt.const),
        description: opt.description,
      }));
      cameraMovementEnum = cameraMovementOptions.map((o) => o.value);
    } else if (Array.isArray(cmProp.enum)) {
      cameraMovementEnum = cmProp.enum;
      cameraMovementOptions = cmProp.enum.map((val: string) => ({
        value: val,
        label: formatLabel(val),
      }));
    }
  }

  // 6. Formats & Quality
  const outputFormatProp = props.outputFormat || {};
  const outputFormatOptions = Array.isArray(outputFormatProp.enum)
    ? outputFormatProp.enum
    : ["MP4", "WEBM", "MOV"];
  const defaultOutputFormat = outputFormatProp.default || "MP4";

  const outputQualityProp = props.outputQuality || {};
  const outputQualityDefault = typeof outputQualityProp.default === "number" ? outputQualityProp.default : 95;
  const outputQualityMin = typeof outputQualityProp.minimum === "number" ? outputQualityProp.minimum : 20;
  const outputQualityMax = typeof outputQualityProp.maximum === "number" ? outputQualityProp.maximum : 99;

  const numberResultsProp = props.numberResults || {};
  const numberResultsDefault = typeof numberResultsProp.default === "number" ? numberResultsProp.default : 1;
  const numberResultsMin = typeof numberResultsProp.minimum === "number" ? numberResultsProp.minimum : 1;
  const numberResultsMax = typeof numberResultsProp.maximum === "number" ? numberResultsProp.maximum : 4;

  const fpsProp = props.fps || {};
  const fpsOptions = Array.isArray(fpsProp.enum) ? fpsProp.enum : [24, 25, 48, 50];
  const fpsDefault = typeof fpsProp.default === "number" ? fpsProp.default : 25;

  // 7. Pricing Extraction
  const pricingInfo: RunwarePricingInfo = info["x-pricing"] || {};
  const costList: Array<{ resolution: string; cost: number }> = [];

  // Parse examples if present
  if (Array.isArray(pricingInfo.examples)) {
    for (const ex of pricingInfo.examples) {
      if (!ex.configuration || !ex.price) continue;
      const numPrice = parseFloat(ex.price.replace(/[^0-9.]/g, ""));
      const durMatch = ex.configuration.match(/(\d+)s\b/i);
      const resMatch = ex.configuration.match(/(720p|768p|1080p|1440p|2k|4k)\b/i);
        if (resMatch && numPrice) {
          let resKey = resMatch[1].toLowerCase();
          const dur = durMatch ? parseInt(durMatch[1], 10) : 1;
          const perSecCost = +(numPrice / dur).toFixed(2);
          if (!costList.some((c) => c.resolution === resKey)) {
            costList.push({ resolution: resKey, cost: perSecCost });
          }
          if (resKey === "1440p" && !costList.some((c) => c.resolution === "2k")) {
            costList.push({ resolution: "2k", cost: perSecCost });
          }
        } else if (durMatch && numPrice && !costList.some((c) => c.resolution === "default")) {
          const dur = parseInt(durMatch[1], 10) || 1;
          const perSecCost = +(numPrice / dur).toFixed(2);
          costList.push({ resolution: "default", cost: perSecCost });
        }
    }
  }

  // Parse overview (e.g. "Output video costs $0.08 per second at 768p and $0.13 per second at 2K")
  if (pricingInfo.overview) {
    const overviewMatches = Array.from(
      pricingInfo.overview.matchAll(/\$([0-9.]+)[^0-9a-z]*per\s+second[^0-9a-z]*(?:for|at)\s*([0-9a-z]+)/gi)
    );
    for (const m of overviewMatches) {
      const perSec = parseFloat(m[1]);
      let res = m[2].toLowerCase();
      if (!costList.some((c) => c.resolution === res)) {
        costList.push({ resolution: res, cost: perSec });
      }
      if (res === "2k" && !costList.some((c) => c.resolution === "1440p")) {
        costList.push({ resolution: "1440p", cost: perSec });
      }
    }
  }

  // Default fallback pricing for common video models if absent
  if (costList.length === 0) {
    costList.push(
      { resolution: "720p", cost: 0.09 },
      { resolution: "1080p", cost: 0.13 },
      { resolution: "2k", cost: 0.19 },
      { resolution: "4k", cost: 0.3 }
    );
  }

  // 8. Build Normalized Model Object
  return {
    name,
    organisation: creatorName,
    provider: "runware",
    value: airId,
    air_id: airId,
    href,
    paid: true,
    type: "text-video-reference",
    description,
    rawSchema: schema,
    supportedResolutions,
    supportedDurations,
    cost: costList,
    max_frame_image_Attachments: maxFrameImages,
    max_reference_image_Attachments: maxRefImages,
    max_reference_video_Attachments: maxRefVideos,
    max_reference_audio_Attachments: maxRefAudios,
    input: {
      positivePrompt: {
        type: "string",
        required: true,
        description: props.positivePrompt?.description || "Text prompt describing elements to include.",
        minLength: props.positivePrompt?.minLength,
        maxLength: props.positivePrompt?.maxLength,
      },
      duration: {
        type: "integer",
        default: defaultDuration,
        enum: supportedDurations,
        description: durationProp.description || "Length of the generated video in seconds.",
      },
      resolution: {
        type: "string",
        default: resolutionOptions.includes("1080p") ? "1080p" : resolutionOptions[0] || "720p",
        enum: resolutionOptions,
        description: "Resolution preset for video generation.",
      },
      aspect_ratio: {
        type: "string",
        default: aspectRatioOptions.includes("16:9") ? "16:9" : aspectRatioOptions[0] || "16:9",
        enum: aspectRatioOptions,
        description: "Aspect ratio for the video output.",
      },
      width: props.width
        ? {
            type: "integer",
            default: props.width.default || 1920,
            description: props.width.description,
          }
        : undefined,
      height: props.height
        ? {
            type: "integer",
            default: props.height.default || 1080,
            description: props.height.description,
          }
        : undefined,
      fps: {
        type: "integer",
        default: fpsDefault,
        enum: fpsOptions,
        description: fpsProp.description || "Frames per second for video generation.",
      },
      inputs: {
        frameImages: maxFrameImages > 0
          ? {
              type: "array",
              maxItems: maxFrameImages,
              minItems: inputsProp.frameImages?.minItems ?? 1,
              description: inputsProp.frameImages?.description || "Frame-specific image inputs.",
            }
          : undefined,
        referenceImages: maxRefImages > 0
          ? {
              type: "array",
              maxItems: maxRefImages,
              minItems: inputsProp.referenceImages?.minItems ?? 1,
              description: inputsProp.referenceImages?.description || "Reference images to guide generation.",
            }
          : undefined,
        referenceVideos: maxRefVideos > 0
          ? {
              type: "array",
              maxItems: maxRefVideos,
              description: inputsProp.referenceVideos?.description,
            }
          : undefined,
        referenceAudios: maxRefAudios > 0
          ? {
              type: "array",
              maxItems: maxRefAudios,
              description: inputsProp.referenceAudios?.description,
            }
          : undefined,
        audio: inputsProp.audio
          ? {
              type: "string",
              description: inputsProp.audio.description,
            }
          : undefined,
      },
      settings: {
        audio: settingsProp.audio
          ? {
              type: "boolean",
              default: true,
              description: settingsProp.audio.description || "Generate synchronized audio.",
            }
          : undefined,
        cameraMovement: cameraMovementEnum.length > 0
          ? {
              type: "string",
              enum: cameraMovementEnum,
              options: cameraMovementOptions,
              description: cmProp?.description || "Cinematic camera movement.",
            }
          : undefined,
        enhancePrompt: settingsProp.enhancePrompt
          ? {
              type: "boolean",
              default: true,
              description: settingsProp.enhancePrompt.description || "Enhance prompt with AI.",
            }
          : undefined,
      },
      outputFormat: {
        type: "string",
        default: defaultOutputFormat,
        enum: outputFormatOptions,
        description: outputFormatProp.description || "Specifies the file format of the generated output.",
      },
      outputQuality: {
        type: "integer",
        default: outputQualityDefault,
        minimum: outputQualityMin,
        maximum: outputQualityMax,
        description: outputQualityProp.description || "Compression quality of the output.",
      },
      numberResults: {
        type: "integer",
        default: numberResultsDefault,
        minimum: numberResultsMin,
        maximum: numberResultsMax,
        description: numberResultsProp.description || "Number of video variations to generate.",
      },
      safety: props.safety,
      seed: props.seed,
    },
  };
}
