import Link from "next/link";
import { Article, articleMetadata } from "@/app/_seo/article";
import { howToMakeAiVideo } from "@/app/_seo/articles";
import type { Faq } from "@/app/_seo/json-ld";
import { Bullets, Paragraphs, Section } from "@/app/_seo/sections";

export const metadata = articleMetadata(howToMakeAiVideo);

const faqs: Faq[] = [
  {
    q: "How do I make an AI video for free?",
    a: "Use a tool with a free tier and keep clips short, or run an open-source model such as Wan or LTX-Video on your own computer for unlimited free videos. On [VideoGenEditor](/) signing up is free and each clip's cost is shown before you generate, so you only pay for the shots you keep.",
  },
  {
    q: "How long does it take to make an AI video?",
    a: "A single clip usually generates in under a minute to a few minutes. A finished 30 to 60 second video, with planning, several generations and editing, typically takes an hour or two.",
  },
  {
    q: "Can I make an AI video from a photo?",
    a: "Yes. Upload the photo to an [AI image to video](/image-to-video) generator and describe the motion. The photo becomes the first frame and the AI animates it.",
  },
  {
    q: "How do I make an AI video with my own voice or music?",
    a: "Generate the visuals, then add your voice-over or track in an editor. Or attach your audio to an audio-to-video model, as in the [AI music video generator](/ai-music-video-generator), so the visuals are generated with your sound.",
  },
  {
    q: "What is the easiest way to create an AI video?",
    a: "Write one sentence describing a scene, like “a golden retriever running on a beach at sunset, slow motion”, and generate it with [text to video AI](/text-to-video). You can refine from there.",
  },
];

export default function HowToMakeAiVideo() {
  return (
    <Article article={howToMakeAiVideo} faqs={faqs}>
      <Section title="The quick answer">
        <Paragraphs
          items={[
            "To make an AI video, describe a scene in writing (or upload a photo), choose a video model, set the aspect ratio and length, and generate. Then review the result, refine your prompt, and join your best clips into a finished video. Here's the whole process in six steps:",
          ]}
        />
        <ol className="flex list-decimal flex-col gap-2 pl-5 leading-7 text-zinc-700 marker:font-semibold dark:text-zinc-300">
          <li>Pick your starting point: text, an image, audio or an existing video.</li>
          <li>Write a prompt that describes one shot.</li>
          <li>Choose a model that suits the shot.</li>
          <li>Set the format: aspect ratio, length and sound.</li>
          <li>Generate, review and iterate.</li>
          <li>Extend, edit and assemble your clips.</li>
        </ol>
      </Section>

      <Section title="Step 1: Pick your starting point">
        <Paragraphs
          items={[
            "Every AI video starts from one of four inputs, and the right one depends on what you already have:",
          ]}
        />
        <Bullets
          items={[
            "Text only: you have an idea or a script. Use [text to video AI](/text-to-video).",
            "An image: you have a photo, a product shot or artwork to bring to life. Use [AI image to video](/image-to-video).",
            "Audio: you have a song or a voice track. Use an audio-to-video model, such as in the [AI music video generator](/ai-music-video-generator).",
            "A video: you have footage to change or lengthen. Use the [AI video editor](/ai-video-editor) or the [AI video extender](/ai-video-extender).",
          ]}
        />
      </Section>

      <Section title="Step 2: Write a prompt that describes one shot">
        <Paragraphs
          items={[
            "AI video models generate one continuous shot at a time, so a good prompt describes a single moment in detail, not a whole story. A reliable formula is:",
          ]}
        />
        <p className="rounded-lg border border-black/10 px-4 py-3 font-medium dark:border-white/15">
          Subject + action + setting + camera + lighting and style + sound
        </p>
        <Paragraphs
          items={[
            "For example: “An elderly fisherman (subject) pulls a net onto a small wooden boat (action) on a misty lake at dawn (setting), slow push-in from the shore (camera), soft golden light, film grain (style), gentle water lapping and distant birds (sound).”",
            "Be specific where it matters and leave out what doesn't. Name camera moves (dolly-in, tracking shot, drone flyover, handheld), and keep to one main action per clip. When you animate a photo, describe only the motion; the model can already see the image.",
          ]}
        />
      </Section>

      <Section title="Step 3: Choose a model">
        <Paragraphs
          items={[
            "Different models have different strengths, and the gap between them changes every few months. A practical approach is to test your prompt on a fast, inexpensive model first, then re-run the version you like on a higher-quality one.",
          ]}
        />
        <Bullets
          items={[
            "Fast drafts: LTX-2.5 Fast and LTX-2.3 Fast.",
            "Long, consistent scenes and ads: Seedance 2.5 (native clips of up to 30 seconds).",
            "Text, image, audio and video inputs with native sound: Wan 3.0.",
            "Cinematic motion from one frame: MiniMax H3 Max.",
            "Up to 4K, and extending scenes: Gemini Omni Flash 1.1.",
          ]}
        />
        <Paragraphs
          items={[
            "On [VideoGenEditor](/) all of these share one prompt box, so switching models keeps your prompt and attachments. For a wider look at the market, see the [best free AI video generators](/blog/best-free-ai-video-generators).",
          ]}
        />
      </Section>

      <Section title="Step 4: Set the format">
        <Bullets
          items={[
            "Aspect ratio: 9:16 for TikTok, Reels and Shorts; 16:9 for YouTube and websites; 1:1 for feeds.",
            "Length: most models make 5 to 20 seconds per clip. Shorter clips are cheaper and usually more coherent.",
            "Sound: turn on native audio if the model supports it, and describe the sounds in your prompt.",
            "Resolution: draft at lower resolution, then render the final at 1080p or higher.",
          ]}
        />
      </Section>

      <Section title="Step 5: Generate, review and iterate">
        <Paragraphs
          items={[
            "Your first generation is a draft. Watch it for three things: whether the motion is what you asked for, whether faces and objects stay consistent, and whether anything strange appears (extra fingers, melting objects, text errors). Then change one thing at a time: tighten the wording, simplify the action, or try another model. Generating two or three variations of a shot and keeping the best is normal practice, even for professionals.",
          ]}
        />
      </Section>

      <Section title="Step 6: Extend, edit and assemble">
        <Paragraphs
          items={[
            "When a clip is almost right, you don't have to start over. Use the [AI video extender](/ai-video-extender) to continue a shot that ends too soon, and the [AI video editor](/ai-video-editor) to change the sky, the style or an object while keeping the motion. Finally, bring your clips into any video editor, put them in order, and add music, a voice-over and captions.",
          ]}
        />
      </Section>

      <Section title="How to generate video with AI for free">
        <Bullets
          items={[
            "Use free tiers: many hosted generators give free credits that refresh daily or monthly. Keep clips short to make them go further.",
            "Run open-source models: Wan and LTX-Video can run on your own computer with a strong graphics card, for free and without watermarks.",
            "Draft cheaply: on [VideoGenEditor](/), signing up is free and every clip shows its estimated cost before you generate, so you can draft on low-cost models and only pay for premium renders you keep.",
          ]}
        />
      </Section>

      <Section title="How to make an AI tribute video">
        <Paragraphs
          items={[
            "AI can gently bring old photos to life for a memorial, an anniversary or a birthday tribute. Handle it with care. These are real people, and subtle, natural motion almost always feels better than dramatic effects.",
          ]}
        />
        <ol className="flex list-decimal flex-col gap-2 pl-5 leading-7 text-zinc-700 marker:font-semibold dark:text-zinc-300">
          <li>Gather the photos and scan prints at high resolution. Sharper photos animate more faithfully.</li>
          <li>
            Upload each one to the <Link href="/image-to-video" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">image to video</Link> tool as the first frame.
          </li>
          <li>Ask for small movements: “a soft smile, a slow blink, a slight turn toward the camera, gentle breeze”.</li>
          <li>Keep clips short (5 to 6 seconds) and generate a couple of versions of each photo.</li>
          <li>Arrange the clips with the still photos and a meaningful song in your editor.</li>
        </ol>
        <Paragraphs
          items={[
            "Share tribute videos with the family's blessing, and avoid making people say or do things they never did.",
          ]}
        />
      </Section>

      <Section title="Common mistakes to avoid">
        <Bullets
          items={[
            "Packing a whole story into one prompt. Split it into shots.",
            "Vague prompts like “a cool video of a city”. Name the subject, the action and the camera.",
            "Changing character descriptions between shots. Copy them exactly, or use a reference image.",
            "Asking for long paragraphs of on-screen text. Add captions in your editor instead.",
            "Rendering every draft at full resolution. Draft small, then finalise.",
          ]}
        />
      </Section>
    </Article>
  );
}
