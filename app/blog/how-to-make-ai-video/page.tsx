import Link from "next/link";
import { Article, articleMetadata } from "@/app/_seo/article";
import { howToMakeAiVideo } from "@/app/_seo/articles";
import type { Faq } from "@/app/_seo/json-ld";
import { Bullets, Paragraphs, Section } from "@/app/_seo/sections";

export const metadata = articleMetadata(howToMakeAiVideo);

const faqs: Faq[] = [
  {
    q: "How do I make an AI video for free?",
    a: "Use a tool with a free tier and keep your clips short, or run an open-source model such as Wan or LTX-Video on your own computer for unlimited free videos. On [VideoGenEditor](/) signing up is free but generating isn't. You see each clip's price before you make it, and a quick 360p test costs a few cents.",
  },
  {
    q: "How long does it take to make an AI video?",
    a: "A single clip takes anywhere from under a minute to a few minutes. A finished 30 to 60 second video, with planning, a few rounds of generating and editing, usually takes an hour or two.",
  },
  {
    q: "Can I make an AI video from a photo?",
    a: "Yes. Upload the photo to an [AI image to video](/image-to-video) generator and describe how it should move. The photo becomes the first frame and the AI animates it from there.",
  },
  {
    q: "How do I make an AI video with my own voice or music?",
    a: "Either generate the visuals and add your voice-over or track in an editor, or attach the audio to an audio-to-video model, like the one in the [AI music video generator](/ai-music-video-generator), so the visuals are made around your sound.",
  },
  {
    q: "What is the easiest way to create an AI video?",
    a: "Write one sentence about a scene, like “a golden retriever running on a beach at sunset, slow motion”, and generate it with [text to video AI](/text-to-video). Then refine from there.",
  },
];

export default function HowToMakeAiVideo() {
  return (
    <Article article={howToMakeAiVideo} faqs={faqs}>
      <Section title="The quick answer">
        <Paragraphs
          items={[
            "To make an AI video, describe a scene in writing (or upload a photo), choose a video model, set the shape and length, and generate. Watch what comes back, adjust the prompt, and join your best clips into the finished video. Here's the whole process in six steps:",
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
            "Every AI video starts from one of four things. Which one depends on what you've already got:",
          ]}
        />
        <Bullets
          items={[
            "Just text: you have an idea or a script. Use [text to video AI](/text-to-video).",
            "An image: you have a photo, a product shot or a piece of art to bring to life. Use [AI image to video](/image-to-video).",
            "Audio: you have a song or a voice track. Use an audio-to-video model, like the one in the [AI music video generator](/ai-music-video-generator).",
            "A video: you have footage to change or make longer. Use the [AI video editor](/ai-video-editor) or the [AI video extender](/ai-video-extender).",
          ]}
        />
      </Section>

      <Section title="Step 2: Write a prompt that describes one shot">
        <Paragraphs
          items={[
            "Video models make one continuous shot at a time, so a good prompt describes a single moment in detail, not a whole story. This formula works well:",
          ]}
        />
        <p className="rounded-lg border border-black/10 px-4 py-3 font-medium dark:border-white/15">
          Subject + action + setting + camera + lighting and style + sound
        </p>
        <Paragraphs
          items={[
            "For example: “An elderly fisherman (subject) pulls a net onto a small wooden boat (action) on a misty lake at dawn (setting), slow push-in from the shore (camera), soft golden light, film grain (style), gentle water lapping and distant birds (sound).”",
            "Be specific where it counts and skip what doesn't. Name the camera move (dolly-in, tracking shot, drone flyover, handheld) and stick to one main action per clip. When you're animating a photo, only describe the motion. The model can already see the image.",
          ]}
        />
      </Section>

      <Section title="Step 3: Choose a model">
        <Paragraphs
          items={[
            "Each model has its own strengths, and the leader changes every few months. The practical approach: test your prompt on a fast, cheap model first, then run the version you like on a higher-quality one.",
          ]}
        />
        <Bullets
          items={[
            "Fast drafts: LTX-2.5 Fast and LTX-2.3 Fast.",
            "Long, consistent scenes and ads: Seedance 2.5 (native clips of up to 30 seconds).",
            "Text, image, audio and video inputs with native sound: Wan 3.0.",
            "Cinematic motion from one frame: MiniMax H3 Max.",
            "Cheap 360p tests, up to 4K, and extending scenes: Gemini Omni Flash 1.1.",
          ]}
        />
        <Paragraphs
          items={[
            "On [VideoGenEditor](/) all of these share one prompt box, so switching models keeps your prompt and attachments. For a look at the wider market, see the [best free AI video generators](/blog/best-free-ai-video-generators).",
          ]}
        />
      </Section>

      <Section title="Step 4: Set the format">
        <Bullets
          items={[
            "Shape: 9:16 for TikTok, Reels and Shorts, 16:9 for YouTube and websites, 1:1 for feeds.",
            "Length: most models make 5 to 20 seconds per clip. Shorter clips cost less and usually hold together better.",
            "Sound: if the model can generate audio, turn it on and describe the sounds in your prompt.",
            "Resolution: draft at 360p or 720p, then render the final at 1080p or higher.",
          ]}
        />
      </Section>

      <Section title="Step 5: Generate, review and iterate">
        <Paragraphs
          items={[
            "Treat your first generation as a draft. Watch it for three things: is the motion what you asked for, do faces and objects stay consistent, and does anything weird show up (extra fingers, melting objects, garbled text)? Then change one thing at a time. Tighten the wording, simplify the action, or try another model. Making two or three versions of a shot and keeping the best is normal, even for professionals.",
          ]}
        />
      </Section>

      <Section title="Step 6: Extend, edit and assemble">
        <Paragraphs
          items={[
            "When a clip is almost right, you don't need to start over. The [AI video extender](/ai-video-extender) continues a shot that ends too soon, and the [AI video editor](/ai-video-editor) changes the sky, the style or an object while keeping the motion. Last, bring your clips into any video editor, put them in order, and add music, a voice-over and captions.",
          ]}
        />
      </Section>

      <Section title="How to generate video with AI for free">
        <Bullets
          items={[
            "Use free tiers. Many hosted generators hand out free credits that refresh daily or monthly. Keep clips short to make them last.",
            "Run an open-source model. Wan and LTX-Video run on your own computer if you have a strong graphics card, for free and without watermarks.",
            "Draft cheaply. On [VideoGenEditor](/) generating isn't free, but every clip shows its price first, and a 3-second 360p test costs a few cents. Rough out your shots that way and only pay for premium renders once you know what you want.",
          ]}
        />
      </Section>

      <Section title="How to make an AI tribute video">
        <Paragraphs
          items={[
            "AI can gently bring old photos to life for a memorial, an anniversary or a birthday. Go carefully, though. These are real people, and subtle, natural movement almost always feels better than anything dramatic.",
          ]}
        />
        <ol className="flex list-decimal flex-col gap-2 pl-5 leading-7 text-zinc-700 marker:font-semibold dark:text-zinc-300">
          <li>Gather the photos and scan prints at high resolution. Sharper photos animate more faithfully.</li>
          <li>
            Upload each one to the <Link href="/image-to-video" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">image to video</Link> tool as the first frame.
          </li>
          <li>Ask for small movements: “a soft smile, a slow blink, a slight turn toward the camera, a gentle breeze”.</li>
          <li>Keep clips short (5 or 6 seconds) and make a couple of versions of each photo.</li>
          <li>In your editor, arrange the clips with the still photos and a song that means something to the family.</li>
        </ol>
        <Paragraphs
          items={[
            "Share tribute videos with the family's blessing, and don't make anyone say or do things they never did.",
          ]}
        />
      </Section>

      <Section title="Common mistakes to avoid">
        <Bullets
          items={[
            "Cramming a whole story into one prompt. Split it into shots.",
            "Vague prompts like “a cool video of a city”. Say who or what, what happens, and where the camera is.",
            "Describing a character differently from shot to shot. Copy the description exactly, or use a reference image.",
            "Asking for paragraphs of on-screen text. Add captions in your editor instead.",
            "Rendering every draft at full resolution. Draft small, then render the keeper.",
          ]}
        />
      </Section>
    </Article>
  );
}
