import { VideoComposer } from "@/app/generate/video-composer";
import { UserMenu } from "@/app/user-menu";
import { NewWorkspaceButton } from "@/app/workspaces/new-workspace-button";
import { apiFetchAll } from "@/lib/api";
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const email = auth?.claims.email;
  // Google (and most OAuth providers) put the profile photo and name in user_metadata.
  const meta = auth?.claims.user_metadata;
  const avatarUrl: string | undefined = meta?.avatar_url ?? meta?.picture;
  const displayName: string | undefined = meta?.full_name ?? meta?.name;

  let workspaces: Workspace[] = [];
  let apiError: string | null = null;
  try {
    workspaces = await apiFetchAll<Workspace>("/workspaces");
  } catch (err) {
    apiError = err instanceof Error ? err.message : String(err);
  }

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-black/10 bg-background dark:border-white/15">
        <div className="flex h-14 items-center gap-4 px-4">
          {/* min-w-0 lets the workspace strip shrink and scroll instead of pushing the avatar off-screen. */}
          <nav aria-label="Workspaces" className="flex min-w-0 flex-1 items-center gap-2">
            <ul className="flex min-w-0 items-center gap-2 overflow-x-auto">
              {workspaces.map((ws) => (
                <li
                  key={ws.id}
                  className="flex h-9 max-w-48 shrink-0 items-center gap-2 rounded-md border border-black/10 bg-white px-3 text-sm shadow-sm dark:border-white/15 dark:bg-zinc-900"
                >
                  <span className="truncate font-medium">{ws.name}</span>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium capitalize ${roleStyles[ws.role]}`}
                  >
                    {ws.role}
                  </span>
                </li>
              ))}
            </ul>
            <NewWorkspaceButton />
          </nav>

          <UserMenu email={email} displayName={displayName} avatarUrl={avatarUrl} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pt-12 pb-80">
        {apiError ? (
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
      </main>

      <VideoComposer />
    </>
  );
}
