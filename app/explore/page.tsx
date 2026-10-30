import Link from "next/link";
import { PlainHeader } from "@/app/_seo/article";
import { companyMetadata } from "@/app/_seo/company-page";
import { modelPages } from "@/app/_seo/model-pages";
import { SiteFooter } from "@/app/site-footer";
import { publicApiFetchPage } from "@/lib/api";
import type { ExploreVideo } from "@/lib/explore";
import { getModel } from "@/lib/runware/models";
import { SITE_NAME } from "@/lib/site";

export const metadata = companyMetadata(
  "/explore",
  "Explore AI Videos",
  `AI videos made with ${SITE_NAME}: browse what the latest video models can do, with the prompt and model behind each clip.`,
);

/**
 * How long the gallery is cached, in seconds. Kept well under the API's
 * presigned link lifetime (R2_DOWNLOAD_URL_TTL_SECONDS, 1 hour by default)
 * so cached video URLs never expire. Admin uploads refresh it at once.
 */
export const revalidate = 600;

/** The newest videos shown; the API caps a page at 100. */
const LIMIT = 100;

/** The public gallery of videos uploaded by site admins (managed at /admin/upload). */
export default async function ExplorePage() {
  let videos: ExploreVideo[] | null;
  try {
    videos = (await publicApiFetchPage<ExploreVideo>("/explore/videos", { limit: LIMIT, revalidate })).items;
  } catch (err) {
    console.error("Could not load the explore videos", err);
    videos = null;
  }

  return (
    <>
      <PlainHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 pt-12 pb-20">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-2xl flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Explore AI videos</h1>
            <p className="leading-7 text-zinc-700 dark:text-zinc-300">
              Clips made in the studio with today&apos;s leading video models. Each one shows the model and prompt that
              made it, so you can try the same idea yourself.
            </p>
          </div>
          <Link
            href="/generate"
            className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-600/35 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none sm:self-auto dark:focus-visible:ring-offset-zinc-950"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4">
              <path d="M10 1.5l1.9 4.6 4.6 1.9-4.6 1.9L10 14.5l-1.9-4.6L3.5 8l4.6-1.9L10 1.5zM16 13l.9 2.1L19 16l-2.1.9L16 19l-.9-2.1L13 16l2.1-.9L16 13z" />
            </svg>
            Make your own video
          </Link>
        </header>

        {videos === null ? (
          <p className="text-zinc-600 dark:text-zinc-400">The videos couldn&apos;t be loaded. Please try again shortly.</p>
        ) : videos.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">No videos yet. Check back soon.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </ul>
        )}
      </main>
      <SiteFooter className="pb-12" />
    </>
  );
}

function VideoCard({ video }: { video: ExploreVideo }) {
  const model = video.model ? modelLabel(video.model) : null;
  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-black/10 dark:border-white/15">
      {video.url && (
        <video
          // #t=0.1 makes Safari show the first frame instead of a blank box.
          src={`${video.url}#t=0.1`}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black object-contain"
        />
      )}
      <div className="flex flex-col gap-1.5 p-4 text-sm">
        <h2 className="font-medium">{video.title}</h2>
        {video.description && (
          <p className="leading-6 whitespace-pre-line text-zinc-700 dark:text-zinc-300">{video.description}</p>
        )}
        {model && (
          <p className="text-zinc-500">
            Made with{" "}
            {model.href ? (
              <Link href={model.href} className="text-indigo-600 hover:underline dark:text-indigo-400">
                {model.name}
              </Link>
            ) : (
              model.name
            )}
          </p>
        )}
        {video.prompt && (
          <p className="line-clamp-4 leading-6 text-zinc-500">
            <span className="font-medium">Prompt:</span> {video.prompt}
          </p>
        )}
      </div>
    </li>
  );
}

/** The model's display name, linked to its page when it has one. */
function modelLabel(airId: string): { name: string; href: string | null } {
  const page = modelPages.find((p) => p.id === airId);
  if (page) return { name: page.name, href: `/models/${page.slug}` };
  return { name: getModel(airId)?.name ?? airId, href: null };
}
