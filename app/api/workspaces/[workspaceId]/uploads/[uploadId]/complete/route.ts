import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api";
import { notFound, validIds } from "../../ids";

/**
 * POST /api/workspaces/:workspaceId/uploads/:uploadId/complete
 * Called after the browser's PUT to storage: the API checks the file arrived
 * and answers with the upload and its URL.
 */
export async function POST(
  _request: NextRequest,
  ctx: RouteContext<"/api/workspaces/[workspaceId]/uploads/[uploadId]/complete">,
) {
  const { workspaceId, uploadId } = await ctx.params;
  if (!validIds(workspaceId, uploadId)) return notFound();
  return apiProxy(`/workspaces/${workspaceId}/uploads/${uploadId}/complete`, { method: "POST" });
}
