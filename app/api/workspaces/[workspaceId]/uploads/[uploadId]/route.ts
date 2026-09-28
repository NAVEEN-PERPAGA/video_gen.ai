import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api";
import { notFound, validIds } from "../ids";

type Context = RouteContext<"/api/workspaces/[workspaceId]/uploads/[uploadId]">;

/** GET /api/workspaces/:workspaceId/uploads/:uploadId: the upload, with a fresh URL once uploaded. */
export async function GET(_request: NextRequest, ctx: Context) {
  const { workspaceId, uploadId } = await ctx.params;
  if (!validIds(workspaceId, uploadId)) return notFound();
  return apiProxy(`/workspaces/${workspaceId}/uploads/${uploadId}`);
}

/** DELETE /api/workspaces/:workspaceId/uploads/:uploadId: removes the file and its record (204). */
export async function DELETE(_request: NextRequest, ctx: Context) {
  const { workspaceId, uploadId } = await ctx.params;
  if (!validIds(workspaceId, uploadId)) return notFound();
  return apiProxy(`/workspaces/${workspaceId}/uploads/${uploadId}`, { method: "DELETE" });
}
