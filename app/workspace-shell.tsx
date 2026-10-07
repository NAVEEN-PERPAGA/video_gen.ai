import Link from "next/link";
import type { ReactNode } from "react";
import { getAvailableCredits } from "@/app/billing/actions";
import { CreditsBadge } from "@/app/credits-badge";
import { listGenerations } from "@/app/generate/actions";
import { Studio } from "@/app/generate/studio";
import type { ComposerPreset } from "@/app/generate/video-composer";
import { GoogleSignInButton } from "@/app/google-sign-in-button";
import { SiteFooter } from "@/app/site-footer";
import { SiteLogo } from "@/app/site-logo";
import { UserMenu } from "@/app/user-menu";
import { DeleteWorkspaceButton } from "@/app/workspaces/delete-workspace-button";
import { NewWorkspaceButton } from "@/app/workspaces/new-workspace-button";
import { RenameWorkspaceButton } from "@/app/workspaces/rename-workspace-button";
import { apiFetchAll } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

type WorkspaceRole = "owner" | "admin" | "member";

interface Workspace {
  id: number;
  name: string;
  createdAt: string;
  role: WorkspaceRole;
}

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
  let credits: number | null = null;
  if (signedIn) {
    try {
      [workspaces, credits] = await Promise.all([apiFetchAll<Workspace>("/workspaces"), getAvailableCredits()]);
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
      <header className="sticky top-0 z-10 bg-background">
        <div className="flex h-14 items-center gap-4 px-4">
          <SiteLogo className="text-sm font-semibold tracking-tight" />
          {/* min-w-0 lets the workspace strip shrink and scroll instead of pushing the avatar off-screen. */}
          <nav aria-label="Workspaces" className="flex min-w-0 flex-1 items-center gap-2">
            <ul className="flex min-w-0 items-center gap-2 overflow-x-auto">
              {workspaces.map((ws) => (
                <li key={ws.id} className="shrink-0">
                  <Link
                    href={`${path}?workspace=${ws.id}`}
                    aria-current={ws.id === active?.id ? "page" : undefined}
                    className={`flex h-9 max-w-48 items-center gap-2 rounded-md px-3 text-sm transition ${
                      ws.id === active?.id
                        ? "bg-indigo-600 font-semibold text-white dark:bg-indigo-500"
                        : "bg-black/[0.04] font-medium text-zinc-600 hover:bg-black/[0.08] hover:text-foreground dark:bg-white/[0.06] dark:text-zinc-400 dark:hover:bg-white/[0.1]"
                    }`}
                  >
                    {/* Filled dot for the selected workspace, hollow for the rest, so the selection doesn't rely on colour alone. */}
                    <span
                      aria-hidden="true"
                      className={`size-1.5 shrink-0 rounded-full ${
                        ws.id === active?.id ? "bg-white" : "border border-current opacity-60"
                      }`}
                    />
                    <span className="truncate">{ws.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {/* Renaming is limited to owners and admins (the API enforces it too). */}
            {active && active.role !== "member" && (
              <RenameWorkspaceButton key={`rename-${active.id}`} workspaceId={active.id} name={active.name} />
            )}
            {/* Only the owner can delete (the API enforces it too). */}
            {active?.role === "owner" && (
              <DeleteWorkspaceButton key={`delete-${active.id}`} workspaceId={active.id} name={active.name} />
            )}
            {signedIn && <NewWorkspaceButton />}
          </nav>

          {signedIn ? (
            <>
              <CreditsBadge initial={credits} />
              <UserMenu email={email} displayName={displayName} avatarUrl={avatarUrl} />
            </>
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
