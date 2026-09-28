import Link from "next/link";
import type { ReactNode } from "react";
import { listGenerations } from "@/app/generate/actions";
import { Studio } from "@/app/generate/studio";
import type { ComposerPreset } from "@/app/generate/video-composer";
import { GoogleSignInButton } from "@/app/google-sign-in-button";
import { SiteFooter } from "@/app/site-footer";
import { UserMenu } from "@/app/user-menu";
import { NewWorkspaceButton } from "@/app/workspaces/new-workspace-button";
import { apiFetchAll } from "@/lib/api";
import { SITE_NAME } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

type WorkspaceRole = "owner" | "admin" | "member";

interface Workspace {
  id: number;
  name: string;
  createdAt: string;
  role: WorkspaceRole;
}

const roleStyles: Record<WorkspaceRole, string> = {
  owner: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-400/15 dark:text-blue-300",
  member: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300",
};

/**
 * The studio page frame shared by the dashboard and every tool page: header
 * with the workspace strip, the selected workspace's generations with the
 * composer, then `hero`, `children` (the page's article) and the footer.
 * `path` is the page's own URL, so switching workspaces stays on it.
 */
export async function WorkspaceShell({
  path,
  searchParams,
  preset,
  hero,
  children,
}: {
  path: string;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  preset?: ComposerPreset;
  hero?: ReactNode;
  children?: ReactNode;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  // Signed-out visitors get the studio too, so they can see what they could make.
  const signedIn = Boolean(auth?.claims);
  const email = auth?.claims.email;
  // Google (and most OAuth providers) put the profile photo and name in user_metadata.
  const meta = auth?.claims.user_metadata;
  const avatarUrl: string | undefined = meta?.avatar_url ?? meta?.picture;
  const displayName: string | undefined = meta?.full_name ?? meta?.name;

  let workspaces: Workspace[] = [];
  let apiError: string | null = null;
  if (signedIn) {
    try {
      workspaces = await apiFetchAll<Workspace>("/workspaces");
    } catch (err) {
      apiError = err instanceof Error ? err.message : String(err);
    }
  }

  // Videos are generated in the workspace picked in the header (?workspace=<id>), else the first one.
  const { workspace } = await searchParams;
  const active = workspaces.find((ws) => String(ws.id) === workspace) ?? workspaces[0];
  const generations = active ? await listGenerations(active.id) : null;

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-black/10 bg-background dark:border-white/15">
        <div className="flex h-14 items-center gap-4 px-4">
          <Link href="/" className="shrink-0 text-sm font-semibold tracking-tight">
            {SITE_NAME}
          </Link>
          {/* min-w-0 lets the workspace strip shrink and scroll instead of pushing the avatar off-screen. */}
          <nav aria-label="Workspaces" className="flex min-w-0 flex-1 items-center gap-2">
            <ul className="flex min-w-0 items-center gap-2 overflow-x-auto">
              {workspaces.map((ws) => (
                <li key={ws.id} className="shrink-0">
                  <Link
                    href={`${path}?workspace=${ws.id}`}
                    aria-current={ws.id === active?.id ? "page" : undefined}
                    className={`flex h-9 max-w-48 items-center gap-2 rounded-md border bg-white px-3 text-sm shadow-sm transition dark:bg-zinc-900 ${
                      ws.id === active?.id
                        ? "border-indigo-500 ring-2 ring-indigo-500/20 dark:border-indigo-400"
                        : "border-black/10 hover:border-black/25 dark:border-white/15 dark:hover:border-white/30"
                    }`}
                  >
                    <span className="truncate font-medium">{ws.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium capitalize ${roleStyles[ws.role]}`}
                    >
                      {ws.role}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {signedIn && <NewWorkspaceButton />}
          </nav>

          {signedIn ? (
            <UserMenu email={email} displayName={displayName} avatarUrl={avatarUrl} />
          ) : (
            <GoogleSignInButton next={path} />
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pt-12 pb-16">
        {!signedIn ? null : apiError ? (
          <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300">
            Could not load your workspaces: {apiError}
          </p>
        ) : (
          workspaces.length === 0 && (
            <p className="rounded-lg border border-dashed border-black/15 p-10 text-center text-sm text-zinc-600 dark:border-white/20 dark:text-zinc-400">
              You don&apos;t belong to any workspaces yet. Create one with the{" "}
              <span className="font-medium">+</span> button in the header.
            </p>
          )
        )}

        {/*
          Generations come first. Keyed so switching workspaces starts from that
          workspace's first page. Signed out (as search engines are), the gallery
          isn't shown and the hero leads the page.
        */}
        <Studio
          key={active?.id ?? "none"}
          workspaceId={active?.id ?? null}
          initial={generations}
          signedIn={signedIn}
          preset={preset}
        />

        {hero}

        {children}
      </main>

      {/* The composer is pinned to the bottom of the window, so the footer leaves room for it. */}
      <SiteFooter className="pb-80" />
    </>
  );
}
