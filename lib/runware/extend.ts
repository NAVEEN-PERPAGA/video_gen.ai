import type { RunwareModel } from "./models";
import { type AssetItem, autoAdjust, type ComposerValues, initialValues } from "./request";

/**
 * Video extension: continuing a clip past its last frame. Runware has no
 * separate extend task; these models extend through `inputs.video`:
 *  - Seedance 2.5 with `settings.operation: "extend"` (without it, the prompt
 *    decides between editing and extending).
 *  - Gemini Omni Flash 1.1 with a `duration` (3–10 s of new footage, up to
 *    30 s in all); without one, the same request edits the clip instead.
 * The composer always says which one it wants, so an attached clip is
 * either edited or extended, never left to the model to guess.
 */
export const SEEDANCE_EXTEND = "bytedance:seedance@2.5";
export const GEMINI_EXTEND = "google:gemini@omni-flash-1.1";
export const EXTEND_MODEL_IDS = [SEEDANCE_EXTEND, GEMINI_EXTEND];

export type VideoOperation = "edit" | "extend";

export function canExtend(model: RunwareModel) {
  return EXTEND_MODEL_IDS.includes(model.value);
}

function hasVideo(v: ComposerValues) {
  return Boolean(v.assets.video?.length);
}

/** Whether these values extend the input video (rather than edit it). */
export function isExtending(model: RunwareModel, v: ComposerValues) {
  if (!hasVideo(v)) return false;
  if (model.value === SEEDANCE_EXTEND) return v.settings.operation === "extend";
  if (model.value === GEMINI_EXTEND) return v.duration !== undefined;
  return false;
}

/** New seconds a fresh extension asks for: short steps are cheaper and easier to steer. */
const EXTEND_SECONDS = 5;

function extendValues(model: RunwareModel, v: ComposerValues): ComposerValues {
  return {
    ...v,
    // A preset that follows the clip's aspect; exact sizes are rejected with an input video.
    size: v.size.startsWith("res:") ? v.size : "res:720p",
    duration: typeof v.duration === "number" ? v.duration : EXTEND_SECONDS,
    settings: model.value === SEEDANCE_EXTEND ? { ...v.settings, operation: "extend" } : v.settings,
  };
}

function editValues(model: RunwareModel, v: ComposerValues): ComposerValues {
  // Seedance edits keep the clip's length; Gemini edits when no duration is sent.
  if (model.value === SEEDANCE_EXTEND) return { ...v, duration: "auto", settings: { ...v.settings, operation: "edit" } };
  if (model.value === GEMINI_EXTEND) return { ...v, duration: undefined };
  return v;
}

/**
 * Turns `v` into an extension of `video` on `model`: the clip is the only
 * input (both models reject frame images and references next to an input
 * video), the size follows it, and the model's extend switch is on.
 */
export function asExtension(model: RunwareModel, v: ComposerValues, video: AssetItem): ComposerValues {
  return autoAdjust(model, extendValues(model, { ...v, assets: { video: [video] } }));
}

/** Switches the attached clip between being edited and extended. */
export function withOperation(model: RunwareModel, v: ComposerValues, operation: VideoOperation): ComposerValues {
  if (!canExtend(model) || !hasVideo(v)) return v;
  return autoAdjust(model, operation === "extend" ? extendValues(model, v) : editValues(model, v));
}

/**
 * Keeps the operation in step with the attachments, going from `prev` to
 * `next`: a newly attached clip is edited unless extending was already asked
 * for (e.g. the video extender page's preset), and once the clip is gone,
 * its operation (which needs one) is undone.
 */
export function fitOperation(model: RunwareModel, prev: ComposerValues, next: ComposerValues): ComposerValues {
  if (!canExtend(model) || hasVideo(prev) === hasVideo(next)) return next;
  if (hasVideo(next)) return next.settings.operation === "extend" ? extendValues(model, next) : editValues(model, next);
  const initial = initialValues(model);
  if (model.value === SEEDANCE_EXTEND) {
    return {
      ...next,
      settings: { ...next.settings, operation: undefined },
      duration: next.duration === "auto" ? initial.duration : next.duration,
    };
  }
  return { ...next, duration: next.duration ?? initial.duration };
}
