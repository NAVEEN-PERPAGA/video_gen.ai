"use server";

import { randomUUID } from "node:crypto";
import { ApiError, apiFetch, apiFetchPage, apiSend, errorMessages } from "@/lib/api";
import { getModel, type MediaType } from "@/lib/runware/models";
import { buildTask, type ComposerValues, validateTask } from "@/lib/runware/request";
import type { Upload } from "@/lib/uploads";

/** A generation as node_scalable returns it (GET/POST .../generations). */
export interface Generation {
  id: number;
  workspaceId: number;
  status: "processing" | "completed" | "failed";
  /** Which of videoUrls / imageUrls the results are in. */
  mediaType: MediaType;
  model: string | null;
  videoUrls: string[];
  imageUrls: string[];
  /** For Runware tasks (images too), `{ taskType, request }` where `request` is the task that was sent. */
  videoMetadata: { request?: { positivePrompt?: string } } & Record<string, unknown>;
  /** Why the task failed (or partly failed). */
  error: string | null;
  /** Provider cost in USD, when reported. */
  cost: number | null;
  completedAt: string | null;
  createdAt: string;
}

export type GenerateState =
  | {
      errors?: string[];
      generation?: Generation;
      /** The wallet can't cover the generation (402): offer to buy credits. */
      needsCredits?: boolean;
    }
  | undefined;

/**
 * Task fields node_scalable sets itself and rejects if the client sends them
 * (SERVER_FIELDS in its video-models and image-models registries). Image
 * results are always URLs, so the API sets `outputType` for images.
 */
const COMMON_SERVER_FIELDS = ["taskType", "taskUUID", "deliveryMethod", "includeCost", "webhookURL", "uploadEndpoint"];
const SERVER_FIELDS: Record<MediaType, string[]> = {
  video: COMMON_SERVER_FIELDS,
  image: [...COMMON_SERVER_FIELDS, "outputType"],
};

/**
 * Starts a generation in `workspaceId`: a video (text/image to video, or an
 * edit when the task has an input video) or an image, depending on the model.
 * The API answers 202 with a 'processing' generation; poll `getGeneration`
 * for the result.
 */
export async function generate(
  workspaceId: number,
  modelId: string,
  values: ComposerValues,
): Promise<GenerateState> {
  const model = getModel(modelId);
  if (!model) return { errors: ["Unknown model."] };

  // Uploaded files' links expire; swap in fresh ones so Runware can fetch them.
  try {
    values = await withFreshUploadUrls(workspaceId, values);
  } catch (err) {
    return { errors: errorMessages(err, "Could not read an uploaded file.") };
  }

  // Re-check on the server: the client-side hints can be bypassed.
  const task = buildTask(model, values, randomUUID());
  const errors = validateTask(model, values, task);
  if (errors.length > 0) return { errors };

  const body = Object.fromEntries(Object.entries(task).filter(([key]) => !SERVER_FIELDS[model.type].includes(key)));
  try {
    const generation = await apiFetch<Generation>(`/workspaces/${workspaceId}/generations/${model.type}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return { generation };
  } catch (err) {
    // The 402's message already says what's needed; its details are just the numbers.
    if (err instanceof ApiError && err.status === 402) return { errors: [err.message], needsCredits: true };
    return { errors: errorMessages(err, "Could not start the generation.") };
  }
}

export type GenerationsPage =
  | { generations: Generation[]; nextCursor: number | null; error?: undefined }
  | { error: string };

/** How many generations one page of the gallery loads. */
const GENERATIONS_PAGE_SIZE = 24;

/**
 * One page of `workspaceId`'s generations, newest first. Pass the previous
 * page's `nextCursor` to continue. The list reports stored statuses only;
 * poll `getGeneration` to move a processing one along.
 */
export async function listGenerations(workspaceId: number, cursor: number | null = null): Promise<GenerationsPage> {
  try {
    const page = await apiFetchPage<Generation>(`/workspaces/${workspaceId}/generations`, {
      limit: GENERATIONS_PAGE_SIZE,
      cursor,
    });
    return { generations: page.items, nextCursor: page.nextCursor as number | null };
  } catch (err) {
    return { error: errorMessages(err, "Could not load the generations.").join(" ") };
  }
}

/** Polls a generation; the API checks Runware for the task's status as it answers. */
export async function getGeneration(workspaceId: number, generationId: number): Promise<GenerateState> {
  try {
    return { generation: await apiFetch<Generation>(`/workspaces/${workspaceId}/generations/${generationId}`) };
  } catch (err) {
    return { errors: errorMessages(err, "Could not check the generation.") };
  }
}

/**
 * Deletes a generation. Members can delete their own; admins and owners can
 * delete anyone's (the API enforces this).
 */
export async function deleteGeneration(workspaceId: number, generationId: number): Promise<{ error?: string }> {
  try {
    await apiSend(`/workspaces/${workspaceId}/generations/${generationId}`, { method: "DELETE" });
    return {};
  } catch (err) {
    return { error: errorMessages(err, "Could not delete the generation.").join(" ") };
  }
}

/**
 * Replaces each uploaded file's URL with a freshly signed one from the API,
 * which also proves the upload belongs to this workspace.
 */
async function withFreshUploadUrls(workspaceId: number, values: ComposerValues): Promise<ComposerValues> {
  const assets = Object.fromEntries(
    await Promise.all(
      Object.entries(values.assets).map(async ([key, items]) => [
        key,
        await Promise.all(
          items.map(async (item) => {
            if (item.uploadId === undefined) return item;
            const upload = await apiFetch<Upload>(`/workspaces/${workspaceId}/uploads/${item.uploadId}`);
            if (upload.status !== "uploaded" || !upload.url) {
              throw new ApiError(409, `${item.name ?? "A file"} has not finished uploading.`);
            }
            return { ...item, value: upload.url };
          }),
        ),
      ]),
    ),
  );
  return { ...values, assets };
}
