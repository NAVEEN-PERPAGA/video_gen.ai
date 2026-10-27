"use client";

import { VideoComposer } from "@/app/generate/video-composer";

/**
 * The studio composer in the home page hero, with every model and its settings.
 * Visitors here are signed out (signed-in users are sent to /generate), so
 * generating signs them in and opens the studio with the same setup.
 */
export function HomeComposer({ placeholder }: { placeholder?: string }) {
  return (
    <VideoComposer
      variant="inline"
      agent={false}
      signedIn={false}
      workspaceId={null}
      next="/generate"
      preset={{ placeholder }}
    />
  );
}
