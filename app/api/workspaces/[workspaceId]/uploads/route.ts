import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api";
import { notFound, validIds } from "./ids";

/**
 * POST /api/workspaces/:workspaceId/uploads  { fileName, contentType, size }
 * Registers a video upload. Answers 201 with the pending upload in `data` and
 * the presigned PUT (`meta.upload`) the browser sends the file to directly.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/workspaces/[workspaceId]/uploads">) {
  const { workspaceId } = await ctx.params;
  if (!validIds(workspaceId)) return notFound();
  return apiProxy(`/workspaces/${workspaceId}/uploads`, { method: "POST", body: await request.text() });
}
