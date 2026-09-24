"use client";

import { useCallback, useRef, useState } from "react";
import { logout } from "@/app/auth/actions";
import { useDismiss } from "@/lib/use-dismiss";

interface UserMenuProps {
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}

export function UserMenu({ email, displayName, avatarUrl }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useDismiss(rootRef, open, useCallback(() => setOpen(false), []));

  const label = displayName ?? email ?? "Account";

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
        className="block rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote avatar host, no need for next/image optimization
          <img
            src={avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="size-9 rounded-full border border-black/10 object-cover dark:border-white/15"
          />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium uppercase text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
            {label[0]}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-black/10 bg-background p-1 shadow-lg dark:border-white/15"
        >
          <div className="px-3 py-2">
            {displayName && <p className="truncate text-sm font-medium">{displayName}</p>}
            {email && <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">{email}</p>}
          </div>
          <div className="my-1 h-px bg-black/10 dark:bg-white/15" />
          <form action={logout}>
            <button
              type="submit"
              role="menuitem"
              className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
