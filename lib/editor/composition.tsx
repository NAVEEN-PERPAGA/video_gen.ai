/**
 * The Remotion composition that turns a Timeline into video. The editor
 * previews it with @remotion/player; node_scalable renders it to MP4 with
 * @remotion/renderer, so what users see is what they export.
 *
 * KEEP IN SYNC: node_scalable/remotion/composition.tsx is a verbatim copy.
 * It only imports `remotion` and ./timeline, so it can be copied as is.
 *
 * <OffthreadVideo> rather than @remotion/media's <Video>: it needs no CORS
 * on the media URLs (R2 and Runware's CDN don't send CORS headers), and it
 * plays as a plain <video> in the Player.
 */
import type { CSSProperties } from "react";
import { AbsoluteFill, Html5Audio, Img, OffthreadVideo, Sequence, useVideoConfig } from "remotion";
import { clipStarts, type EditorProps, mediaKey, type TextClip, toFrames } from "./timeline";

/** The composition's id, as registered for the server render. */
export const COMPOSITION_ID = "Editor";

/** Frames of a span, measured between rounded edges so back-to-back clips never gap or overlap. */
function span(start: number, duration: number) {
  const from = toFrames(start);
  return { from, durationInFrames: Math.max(1, toFrames(start + duration) - from) };
}

export function EditorComposition({ timeline, sources }: EditorProps) {
  const starts = clipStarts(timeline);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {timeline.clips.map((clip, i) => {
        const src = sources[mediaKey(clip.media)];
        if (!src) return null;
        const style: CSSProperties = { width: "100%", height: "100%", objectFit: clip.fit };
        return (
          // premountFor: the Player starts loading a video a second before it's on screen.
          <Sequence key={clip.id} {...span(starts[i], clip.duration)} premountFor={30} name={`Clip ${i + 1}`}>
            {clip.kind === "image" ? (
              <Img src={src} style={style} />
            ) : (
              <OffthreadVideo
                src={src}
                trimBefore={toFrames(clip.trimStart)}
                volume={clip.volume}
                muted={clip.volume === 0}
                style={style}
              />
            )}
          </Sequence>
        );
      })}

      {timeline.audio.map((audio) => {
        const src = sources[mediaKey(audio.media)];
        if (!src) return null;
        return (
          <Sequence key={audio.id} {...span(audio.start, audio.duration)} premountFor={30} name="Audio">
            <Html5Audio src={src} trimBefore={toFrames(audio.trimStart)} volume={audio.volume} />
          </Sequence>
        );
      })}

      {timeline.texts.map((text) => (
        <Sequence key={text.id} {...span(text.start, text.duration)} name="Text">
          <Caption text={text} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

const JUSTIFY = { top: "flex-start", center: "center", bottom: "flex-end" } as const;

function Caption({ text }: { text: TextClip }) {
  const { height } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        justifyContent: JUSTIFY[text.position],
        alignItems: "center",
        padding: `${height * 0.06}px ${height * 0.04}px`,
      }}
    >
      <div
        style={{
          maxWidth: "90%",
          fontFamily: "Inter, 'Helvetica Neue', Arial, 'Liberation Sans', sans-serif",
          fontWeight: 700,
          fontSize: (text.size / 100) * height,
          lineHeight: 1.2,
          color: text.color,
          textAlign: "center",
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
          ...(text.background
            ? { backgroundColor: "rgba(0, 0, 0, 0.6)", padding: "0.2em 0.45em", borderRadius: "0.25em" }
            : { textShadow: "0 0.05em 0.2em rgba(0, 0, 0, 0.85)" }),
        }}
      >
        {text.text}
      </div>
    </AbsoluteFill>
  );
}
