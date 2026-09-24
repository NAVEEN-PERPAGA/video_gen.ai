"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api";

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
