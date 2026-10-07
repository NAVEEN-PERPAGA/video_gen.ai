import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { modelSpecs } from "@/app/_seo/models";
import { OG_IMAGE, SITE_DISPLAY_NAME } from "@/lib/site";

/** The social preview for every page (pages with their own openGraph list it via OG_IMAGE). */
export const alt = OG_IMAGE.alt;
export const size = { width: OG_IMAGE.width, height: OG_IMAGE.height };
export const contentType = "image/png";

/** One chip per model family, e.g. "Seedance", "LTX", "MiniMax". */
const FAMILIES = [...new Set(modelSpecs.map((m) => m.name.split(/[\s-]/)[0]))];

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/logo.png"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "#ededed",
          background: "radial-gradient(circle at 80% 0%, #4f46e5 0%, #1e1b4b 40%, #0a0a0a 75%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 36, fontWeight: 600 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img>. */}
          <img src={`data:image/png;base64,${logo.toString("base64")}`} width={64} height={64} alt="" />
          {SITE_DISPLAY_NAME}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>AI Video Generator</div>
          <div style={{ fontSize: 34, color: "#c7d2fe" }}>Every leading model, from text, images or audio.</div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {FAMILIES.map((f) => (
            <div
              key={f}
              style={{
                display: "flex",
                padding: "8px 18px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.08)",
                fontSize: 22,
              }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
