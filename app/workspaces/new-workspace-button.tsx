"use client";

import { useActionState, useEffect, useRef } from "react";
import { createWorkspace } from "./actions";

export function NewWorkspaceButton() {
  const [state, formAction, pending] = useActionState(createWorkspace, undefined);
  // Native modal <dialog>: focus trap, Esc to close and backdrop for free.
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Close after a successful create. React resets the form's inputs itself
  // once the action finishes.
  useEffect(() => {
    if (state?.ok) dialogRef.current?.close();
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label="New workspace"
        title="New workspace"
        className="flex size-9 shrink-0 items-center justify-center rounded-md bg-black/[0.04] text-zinc-600 transition hover:bg-black/[0.08] hover:text-foreground dark:bg-white/[0.06] dark:text-zinc-400 dark:hover:bg-white/[0.1]"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg bg-background p-6 text-foreground shadow-xl backdrop:bg-black/40"
      >
        <form action={formAction} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">New workspace</h2>
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input
              name="name"
              required
              maxLength={100}
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
              {pending ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
