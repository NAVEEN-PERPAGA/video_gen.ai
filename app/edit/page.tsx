import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createProjectAndOpen, listProjects } from "@/app/edit/actions";
import { DeleteProjectButton } from "@/app/edit/delete-project-button";
import { SiteLogo } from "@/app/site-logo";
import { apiFetchAll } from "@/lib/api";
import { ASPECTS, type Aspect } from "@/lib/editor/timeline";
import { formatTime } from "@/lib/editor/media";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Video editor",
  robots: { index: false, follow: false },
};

interface Workspace {
  id: number;
  name: string;
}

/**
 * The video editor's projects in the workspace picked with ?workspace=<id>
 * (else the first), and a form to start a new one. The editor itself is
 * /edit/[projectId].
 */
export default async function EditPage({ searchParams }: PageProps<"/edit">) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/login?next=/edit");

  const { workspace, error } = await searchParams;
  let workspaces: Workspace[] = [];
  let apiError: string | null = null;
  try {
    workspaces = await apiFetchAll<Workspace>("/workspaces");
  } catch (err) {
    apiError = err instanceof Error ? err.message : String(err);
  }
  const active = workspaces.find((ws) => String(ws.id) === workspace) ?? workspaces[0];
  const page = active ? await listProjects(active.id) : null;

  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 bg-background px-4">
        <SiteLogo className="text-sm font-semibold tracking-tight" />
        <nav aria-label="Workspaces" className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={{ pathname: "/edit", query: { workspace: ws.id } }}
              aria-current={ws.id === active?.id ? "page" : undefined}
              className="flex h-9 max-w-48 shrink-0 items-center rounded-md bg-black/[0.04] px-3 text-sm font-medium text-zinc-600 transition hover:bg-black/[0.08] hover:text-foreground aria-[current=page]:bg-indigo-600 aria-[current=page]:font-semibold aria-[current=page]:text-white dark:bg-white/[0.06] dark:text-zinc-400 dark:hover:bg-white/[0.1] dark:aria-[current=page]:bg-indigo-500"
            >
              <span className="truncate">{ws.name}</span>
            </Link>
          ))}
        </nav>
        <Link
          href={active ? { pathname: "/generate", query: { workspace: active.id } } : "/generate"}
          className="flex h-9 shrink-0 items-center rounded-md px-3 text-sm font-medium text-zinc-600 transition hover:text-foreground dark:text-zinc-400"
        >
          Studio
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pt-10 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Video editor</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Cut your generations and uploads together, add captions and music, and export an MP4.
            </p>
          </div>
          {active && (
            <form action={createProjectAndOpen} className="flex items-center gap-2">
              <input type="hidden" name="workspaceId" value={active.id} />
              <label className="sr-only" htmlFor="aspect">
                Aspect ratio
              </label>
              <select
                id="aspect"
                name="aspect"
                defaultValue="16:9"
                className="h-9 rounded-md border border-black/15 bg-transparent px-2 text-sm dark:border-white/20"
              >
                {(Object.keys(ASPECTS) as Aspect[]).map((a) => (
                  <option key={a} value={a}>
                    {a} {ASPECTS[a].label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="h-9 cursor-pointer rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                New project
              </button>
            </form>
          )}
        </div>

        {(apiError || error || page?.error) && (
          <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300">
            {apiError
              ? `Could not load your workspaces: ${apiError}`
              : error
                ? "Could not create the project. Please try again."
                : page?.error}
          </p>
        )}

        {!apiError && workspaces.length === 0 && (
          <p className="rounded-lg border border-dashed border-black/15 p-10 text-center text-sm text-zinc-600 dark:border-white/20 dark:text-zinc-400">
            Create a workspace in the <Link href="/generate" className="underline">studio</Link> first.
          </p>
        )}

        {page && page.error === undefined && (
          page.projects.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {page.projects.map((p) => (
                <li key={p.id} className="group relative">
                  <Link
                    href={{ pathname: `/edit/${p.id}`, query: { workspace: p.workspaceId } }}
                    className="flex h-full flex-col gap-2 rounded-xl border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-white/10 dark:bg-zinc-900"
                  >
                    <span className="truncate pr-8 font-medium">{p.name}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {p.clipCount} {p.clipCount === 1 ? "clip" : "clips"} · {formatTime(p.durationSeconds, { tenths: false })}
                    </span>
                    <span className="mt-auto text-xs text-zinc-500 dark:text-zinc-400">
                      Edited{" "}
                      <time dateTime={p.updatedAt} suppressHydrationWarning>
                        {new Date(p.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </time>
                    </span>
                  </Link>
                  <DeleteProjectButton workspaceId={p.workspaceId} projectId={p.id} name={p.name} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-black/15 p-10 text-center text-sm text-zinc-600 dark:border-white/20 dark:text-zinc-400">
              No projects yet. Start one with <span className="font-medium">New project</span>, or open a generation
              from the studio in the editor.
            </p>
          )
        )}
      </main>
    </>
  );
}
