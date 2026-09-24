"use server";

import { randomUUID } from "node:crypto";
import { getVideoModel } from "@/lib/runware/models";
import { buildTask, type ComposerValues, type RunwareTask, validateTask } from "@/lib/runware/request";

export type GenerateState = { errors?: string[]; task?: RunwareTask } | undefined;

export async function generateVideo(modelId: string, values: ComposerValues): Promise<GenerateState> {
  const model = getVideoModel(modelId);
  if (!model) return { errors: ["Unknown model."] };

  // Re-check on the server: the client-side hints can be bypassed.
  const task = buildTask(model, values, randomUUID());
  const errors = validateTask(model, values, task);
  if (errors.length > 0) return { errors };

  // TODO: send `[task]` to the backend once its generation endpoint exists.
  return { task };
}
