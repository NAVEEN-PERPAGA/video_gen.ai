"use client";

import { useActionState, useEffect, useRef } from "react";
import { renameWorkspace } from "./actions";

export function RenameWorkspaceButton({ workspaceId, name }: { workspaceId: number; name: string }) {
  const [state, formAction, pending] = useActionState(renameWorkspace, undefined);
  // Native modal <dialog>: focus trap, Esc to close and backdrop for free.
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Close after a successful rename.
  useEffect(() => {
    if (state?.ok) dialogRef.current?.close();
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          // Drop any edits left over from a cancelled attempt.
          formRef.current?.reset();
          dialogRef.current?.showModal();
        }}
        aria-label={`Rename ${name}`}
        title="Rename workspace"
        className="flex size-9 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-black/[0.06] hover:text-foreground dark:text-zinc-400 dark:hover:bg-white/[0.1]"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
          <path
            d="M10.5 2.5l3 3L5 14H2v-3l8.5-8.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg bg-background p-6 text-foreground shadow-xl backdrop:bg-black/40"
      >
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Rename workspace</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input
              name="name"
              required
              maxLength={100}
              defaultValue={name}
              autoFocus
              autoComplete="off"
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
            />
          </label>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
