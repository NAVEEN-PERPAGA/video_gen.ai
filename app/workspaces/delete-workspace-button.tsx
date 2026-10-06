"use client";

import { usePathname, useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { deleteWorkspace } from "./actions";

export function DeleteWorkspaceButton({ workspaceId, name }: { workspaceId: number; name: string }) {
  const [state, formAction, pending] = useActionState(deleteWorkspace, undefined);
  // Native modal <dialog>: focus trap, Esc to close and backdrop for free.
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // After a delete, drop the now-dead ?workspace=<id> so the page falls back
  // to the first remaining workspace.
  useEffect(() => {
    if (!state?.ok) return;
    dialogRef.current?.close();
    router.replace(pathname);
  }, [state, router, pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`Delete ${name}`}
        title="Delete workspace"
        className="flex size-9 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-500/15 dark:hover:text-red-400"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
          <path
            d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.75 9.5h6.5L12 4M6.75 6.5v4.5M9.25 6.5v4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg bg-background p-6 text-foreground shadow-xl backdrop:bg-black/40"
      >
        <form action={formAction} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Delete workspace</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Delete <span className="font-medium text-foreground">{name}</span>? All of its images and
            videos are deleted with it. This can&apos;t be undone.
          </p>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              className="rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {pending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
