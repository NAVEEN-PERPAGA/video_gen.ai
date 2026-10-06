"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiFetch, apiSend } from "@/lib/api";

export type CreateWorkspaceState = { error?: string; ok?: boolean } | undefined;

export async function createWorkspace(
  _: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const name = String(formData.get("name") ?? "").trim();
  // Same rule as the API (1-100 chars), checked here for a quick message.
  if (!name) return { error: "Enter a workspace name." };
  if (name.length > 100) return { error: "Name must be 100 characters or fewer." };

  try {
    await apiFetch("/workspaces", { method: "POST", body: JSON.stringify({ name }) });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Could not create the workspace." };
  }

  // Re-render the dashboard so the new card shows up.
  revalidatePath("/");
  return { ok: true };
}

export type RenameWorkspaceState = { error?: string; ok?: boolean } | undefined;

export async function renameWorkspace(
  _: RenameWorkspaceState,
  formData: FormData,
): Promise<RenameWorkspaceState> {
  const workspaceId = Number(formData.get("workspaceId"));
  if (!Number.isInteger(workspaceId) || workspaceId <= 0) return { error: "Unknown workspace." };

  const name = String(formData.get("name") ?? "").trim();
  // Same rule as the API (1-100 chars), checked here for a quick message.
  if (!name) return { error: "Enter a workspace name." };
  if (name.length > 100) return { error: "Name must be 100 characters or fewer." };

  try {
    // Only owners and admins may rename; the API answers 403 for anyone else.
    await apiFetch(`/workspaces/${workspaceId}`, { method: "PATCH", body: JSON.stringify({ name }) });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Could not rename the workspace." };
  }

  // The workspace strip is on the dashboard and every tool page, so refresh them all.
  revalidatePath("/", "layout");
  return { ok: true };
}

export type DeleteWorkspaceState = { error?: string; ok?: boolean } | undefined;

export async function deleteWorkspace(
  _: DeleteWorkspaceState,
  formData: FormData,
): Promise<DeleteWorkspaceState> {
  const workspaceId = Number(formData.get("workspaceId"));
  if (!Number.isInteger(workspaceId) || workspaceId <= 0) return { error: "Unknown workspace." };

  try {
    // Only the owner may delete; the API answers 403 for anyone else. Its
    // generations (and their stored media) are deleted with it.
    await apiSend(`/workspaces/${workspaceId}`, { method: "DELETE" });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Could not delete the workspace." };
  }

  // The workspace strip is on the dashboard and every tool page, so refresh them all.
  revalidatePath("/", "layout");
  return { ok: true };
}
