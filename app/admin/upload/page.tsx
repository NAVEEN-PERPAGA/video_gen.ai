import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PlainHeader } from "@/app/_seo/article";
import { ApiError, apiFetchPage } from "@/lib/api";
import type { ExploreVideo } from "@/lib/explore";
import { videoModels } from "@/lib/runware/models";
import { ExploreUploader } from "./explore-uploader";
import { VideoRow } from "./video-row";

export const metadata: Metadata = {
  title: "Upload videos",
  robots: { index: false },
};

/**
 * Where site admins upload, edit and remove the /explore videos. Who's an admin is
 * decided by the API (ADMIN_EMAILS in node_scalable): everyone else gets a
 * 404 here, and a 403 from the API if they call it directly.
 */
export default async function AdminUploadPage() {
  const videos = await loadVideos();
  const models = videoModels.map(({ value, name, organisation }) => ({ value, name, organisation }));

  return (
    <>
      <PlainHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 pt-10 pb-20">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Upload videos</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Videos uploaded here appear on{" "}
            <Link href="/explore" className="text-indigo-600 hover:underline dark:text-indigo-400">
              /explore
            </Link>{" "}
            for everyone, newest first.
          </p>
        </header>

        <ExploreUploader models={models} />

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold tracking-tight">Uploaded ({videos.length})</h2>
          {videos.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Nothing yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-black/10 rounded-xl border border-black/10 dark:divide-white/15 dark:border-white/15">
              {videos.map((v) => (
                <VideoRow key={v.id} video={v} models={models} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

/** Every video, pending ones included (the API's page cap, newest first). Signed out → login; not an admin → 404. */
async function loadVideos(): Promise<ExploreVideo[]> {
  try {
    return (await apiFetchPage<ExploreVideo>("/admin/explore-videos", { limit: 100 })).items;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/login?next=/admin/upload");
    if (err instanceof ApiError && err.status === 403) notFound();
    throw err;
  }
}
