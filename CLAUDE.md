@AGENTS.md

# VideoGenEditor (video_gen.ai)

Next.js 16 (App Router, React 19, Tailwind 4, TypeScript) frontend for videogeneditor.com: an AI video/image generation studio, a timeline video editor, billing, and SEO landing pages.

## Commands

- `npm run dev` / `npm start`: port **3001** (the backend uses 3000)
- `npm run build`, `npm run lint` (ESLint 9 flat config, `eslint-config-next`)
- No test suite. Verify with `npm run lint` and `npm run build`.
- `node scripts/generate-runware-models.mjs` and `node scripts/generate-runware-image-models.mjs` regenerate model files (see below).

Env (`.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `API_URL` (backend, server-side only), optional `NEXT_PUBLIC_SITE_URL`.

## Architecture

**The backend is a separate repo**: `../node_scalable` (Express + Drizzle + Supabase Postgres + Cloudflare R2). Most features need changes in both repos. This app holds no database access of its own.

- **Auth**: Supabase via `@supabase/ssr`. `proxy.ts` (Next 16's replacement for middleware) calls `lib/supabase/proxy.ts` to refresh the session on every request. Signed-in users hitting `/` or `/login` go to `/generate`. Everything else is browsable while signed out, and the API rejects their requests itself.
- **Talking to the API**: `lib/api.ts` (`server-only`) sends the Supabase access token as a Bearer token to `${API_URL}/api/v1/...`. It provides `apiFetch` (unwraps `{ data }`), `apiSend` (204), `apiFetchPage`/`apiFetchAll` (cursor pagination, `meta.nextCursor`), and `apiProxy` (Route Handlers that pass API responses through to the browser, used by `app/api/workspaces/.../uploads`). Errors arrive as `ApiError`, which `errorMessages` turns into user-facing text.
- **Mutations** go through Server Actions (`app/*/actions.ts`, `"use server"`). The server action body limit is 50 MB (`next.config.ts`) because attached files can travel inline as data URIs.
- **Uploads** (`lib/uploads.ts`): the API returns a signed PUT target, the browser uploads straight to R2, then calls `.../complete`.
- **Credits**: `lib/credits-events.ts` fires a `credits:changed` window event so the header badge refetches.

## Key areas

- `app/generate/`: the studio (`studio.tsx`, `video-composer.tsx`, `model-picker.tsx`), generation actions, and an agent chat (`agent-actions.ts`, `agent-panel.tsx`; xAI Grok by default, OpenAI optional). `app/workspace-shell.tsx` is the signed-in app shell with workspaces, credits, and the user menu.
- `app/edit/`: timeline editor (`/edit`, `/edit/[projectId]`) with a Remotion `@remotion/player` preview. Logic lives in `lib/editor/`: `timeline.ts` (types, FPS, limits), `edit.ts` (pure edit functions that return new timelines, which makes undo possible), `media.ts`, `composition.tsx`. Final exports render server-side in node_scalable.
  - **`lib/editor/timeline.ts` and `lib/editor/composition.tsx` are verbatim copies of `node_scalable/remotion/`.** Edit them here, copy them over, and mirror any timeline shape change in `node_scalable/src/modules/projects/projects.schema.ts`.
- `app/billing/`, `app/pricing/`, `lib/plans.ts`: plans and packs. The ids, prices, and credits must match node_scalable's `CREDIT_PLANS`/`CREDIT_PACKS` and the Dodo Payments dashboard. 1 credit = 1 USD, and credits never expire.
- `lib/runware/`: the model registry and request logic.
  - `models.ts`: `videoModels`/`imageModels`, `getModel(airId)`, `defaultModelIds`, `organisationLogos`.
  - `request.ts`: builds a Runware `videoInference`/`imageInference` task from composer values and validates it with Ajv (JSON Schema 2020, plus cross-field `conditions`/`rules`). It runs in the browser for live hints and on the server for real.
  - `pricing.ts`: estimates cost from each model's `pricing` block. Runware only reports the real cost after a task runs.
  - `extend.ts`: video extend via Seedance 2.5 or Gemini Omni Flash 1.1. `tags.ts`: per-model prompt tags for reference media.
- SEO: `app/_seo/` holds shared page builders and copy (`model-pages.ts`, `tools.ts`, `articles.ts`, `json-ld.tsx`). Tool landing pages (`/text-to-video`, `/image-to-video`, `/ai-video-editor`, ...), `/models/[slug]`, `/blog/*`, `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`. Site identity lives in `lib/site.ts`.

## Model data (`data/`)

- `data/{video,image}/schemas/runware*/`: raw Runware OpenAPI files (source).
- `data/{video,image}/models/runware/*.json`: compact per-model schemas the app uses. **These are generated**: edit the generator scripts, not the JSON. Prices (`PRICING`, `CHECKED` date), rules, field order, and `omitInputs` live in `scripts/generate-runware-*.mjs`, and the shared converter is `scripts/runware-schema.mjs`.
- To add a model (e.g. commit `c6b1ee8`, Kling 4):
  1. Drop the OpenAPI file in the schemas folder.
  2. Add its pricing to the generator and run it.
  3. Import the output in `data/.../models/runware/index.ts` (hand-maintained).
  4. Add the org logo to `organisationLogos` in `lib/runware/models.ts` if the org is new.
  5. Optionally write an SEO page entry in `app/_seo/model-pages.ts`.
- The backend has its own model registry (`SERVER_FIELDS`, etc.), so check whether node_scalable needs the model too.
- Model ids are Runware AIR ids, e.g. `bytedance:seedance@2.5`.
- `data/video/schemas/runware_ai/index.ts` + `parseRunwareSchema.ts` and the `upscale_*` folders aren't imported by the app.

## Conventions

- Import alias `@/*` maps to the repo root.
- Server-only modules import `"server-only"`. Supabase clients are created fresh per request (`lib/supabase/server.ts` for the server, `client.ts` for the browser).
- Code comments are explanatory JSDoc on types and functions. Follow the existing style.
- `model-pages.ts` entries carry an `updated` date used as the sitemap `lastModified`. Bump it only when you edit that entry. Copy must be in our own words (the model descriptions are copied from Runware docs) and must stay true to the model file.
- Migrations against the real Supabase DB (in node_scalable) are run by the user, not by Claude.
