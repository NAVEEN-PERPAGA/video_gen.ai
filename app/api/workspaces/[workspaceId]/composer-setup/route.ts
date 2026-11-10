import type { NextRequest } from "next/server";
import { notFound, validIds } from "@/app/api/workspaces/[workspaceId]/uploads/ids";
import { apiProxy } from "@/lib/api";

/**
 * PUT /api/workspaces/:workspaceId/composer-setup  { modelId, agentMode, lastModelIds, values }
 * Remembers the caller's composer setup in this workspace. A Route Handler, not
 * a Server Action, so the save can outlive the page (`keepalive`) when it's sent
 * on the way out of a workspace or a closing tab.
 */
export async function PUT(request: NextRequest, ctx: RouteContext<"/api/workspaces/[workspaceId]/composer-setup">) {
  const { workspaceId } = await ctx.params;
  if (!validIds(workspaceId)) return notFound();
  return apiProxy(`/workspaces/${workspaceId}/composer-setup`, { method: "PUT", body: await request.text() });
}
