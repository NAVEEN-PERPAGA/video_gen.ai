"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteProject } from "@/app/edit/actions";
import { TrashIcon } from "@/app/generate/icons";

/** Deletes a project after confirming, then refreshes the list. Its exported videos stay in the gallery. */
export function DeleteProjectButton({ workspaceId, projectId, name }: { workspaceId: number; projectId: number; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm(`Delete "${name}"? Videos you exported from it stay in the studio.`)) return;
    startTransition(async () => {
      const result = await deleteProject(workspaceId, projectId);
      if (result.error) window.alert(result.error);
      else router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      aria-label={`Delete ${name}`}
      title="Delete"
      className="absolute top-3 right-3 flex size-8 cursor-pointer items-center justify-center rounded-full text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-600 focus-visible:opacity-100 disabled:cursor-wait disabled:opacity-100"
    >
      <TrashIcon className="size-4" />
    </button>
  );
}
