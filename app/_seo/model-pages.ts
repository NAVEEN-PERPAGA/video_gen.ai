import type { Faq } from "@/app/_seo/json-ld";
import { perSecond, usd, videoModel } from "@/app/_seo/models";

/**
 * Copy for the model pages (/models/<slug>). Specs and prices on the page are
 * read from data/video/models; this file holds what the data can't say:
 * what each model is good at, its limits, and how to prompt it.
 *
 * Write it in our own words. The model files' descriptions are copied from
 * Runware's docs, so reusing them would be duplicate content.
 * Keep every claim true to the model file (inputs, lengths, sizes, settings).
 */

/** When the model pages last changed; the sitemap's lastModified. Bump it with every edit here. */
export const MODELS_UPDATED = "2026-10-08";

export interface ModelPage {
  /** The model's AIR id in data/video/models. */
  id: string;
  slug: string;
  /** How the copy names it (the model files say "Wan3.0"). */
  name: string;
  maker: string;
  /** <title>, 60 characters or fewer. */
  title: string;
  /** Meta description, about 150 characters. */
  description: string;
  h1: string;
  /** One line for the /models index. */
  summary: string;
  intro: string;
  /** Generates sound with the picture. */
  audio: boolean;
  strengths: string[];
  bestFor: { title: string; body: string }[];
  limits: string[];
  prompt: { text: string; note: string };
  faqs: Faq[];
  /** Other model pages to suggest, by slug, with why. */
  alternatives: { slug: string; why: string }[];
  /** Tool pages this model suits, by path. */
  tools: string[];
}

const SEEDANCE = "bytedance:seedance@2.5";
const WAN = "alibaba:wan@3.0";
const WAN_PRIME = "alibaba:wan@3.0-prime";
const GEMINI = "google:gemini@omni-flash-1.1";
const LTX_25 = "lightricks:ltx@2.5-fast";
const LTX_23 = "lightricks:ltx@2.3-fast";
const H3 = "minimax:h3@0";
const H3_MAX = "minimax:h3@max";
const H3_TURBO = "minimax:h3@max-turbo";
const H3_FAST = "minimax:h3@fast";
const FLUX = "bfl:flux@3-video";
const HAPPYHORSE = "alibaba:happyhorse@1.1";
const GROK = "xai:grok-imagine@video-1.5";
const GROK_LITE = "xai:grok-imagine@video-1.5-lite";

/** "$0.10" for a model's rate at a tier, per second. */
const rate = (id: string, tier: string) => usd(perSecond(id, tier));
/** "$1.20" for a clip of `seconds` at a tier. */
const clip = (id: string, tier: string, seconds: number) => usd(perSecond(id, tier) * seconds);
/** A model's pricing record, for surcharges and special modes. */
const pricing = (id: string) => videoModel(id).pricing!;
const fluxDraft = usd(pricing(FLUX).draft!.perSecond);
const fluxVideoInput = usd(pricing(FLUX).videoInput!["720p"]);
const h3Images = pricing(H3).perInputImage!;
const h3VideoInput = usd(pricing(H3).inputVideoPerSecond!);
const grokImage = usd(pricing(GROK).perInputImage!.price);
const grokLiteImage = usd(pricing(GROK_LITE).perInputImage!.price);

export const modelPages: ModelPage[] = [
  {
    id: SEEDANCE,
    slug: "seedance-2-5",
    name: "Seedance 2.5",
    maker: "ByteDance",
    title: "Seedance 2.5 AI Video Generator – Try It Online",
    description:
      "Use ByteDance's Seedance 2.5 online: 30-second clips, up to 30 reference images, edit and extend modes, and sound. Specs, prices and prompt tips.",
    h1: "Seedance 2.5: ByteDance's AI Video Model for Long, Consistent Scenes",
    summary: "Long, consistent scenes up to 30 seconds, huge reference sets, and edit and extend modes.",
    intro:
      "Seedance 2.5 is ByteDance's high-end video model, and it's the one to reach for when a shot has to hold together. It makes continuous clips of up to 30 seconds in one go, keeps people and products looking the same from start to finish, and follows long, detailed prompts closely. It can also edit or extend footage you already have.",
    audio: true,
    strengths: [
      "Clips of 4 to 30 seconds in a single generation, the longest in the studio.",
      "Big reference sets: up to 30 images, 10 videos and 10 audio clips to pin down characters, products, style and sound.",
      "Close instruction following, including multi-part prompts and prompts in other languages.",
      "Edit mode changes part of a clip and leaves the rest of the shot alone. Extend mode carries a clip past its last frame.",
      "First and last frame control for image-to-video.",
      "Synchronized sound when you switch audio on.",
    ],
    bestFor: [
      { title: "Ads and product videos", body: "Reference images keep the product right in every shot. See the [AI UGC video generator](/ai-ugc-video-generator)." },
      { title: "Longer story scenes", body: "Explainers and narrative shots that need more than a few seconds to play out." },
      { title: "Editing real footage", body: "Swap a sky or add an object without a VFX pass, in the [AI video editor](/ai-video-editor)." },
      { title: "Extending clips", body: "Keep a shot going in the [AI video extender](/ai-video-extender)." },
    ],
    limits: [
      `It's one of the pricier models, especially at 1080p (${rate(SEEDANCE, "1080p")} a second), so draft at 480p first.`,
      "Seedance is billed per token, so the per-second prices are close approximations. The composer shows the estimate for your exact settings.",
      "Editing or extending a video costs a little more per second than generating from scratch.",
      "It tops out at 1080p. For 4K, use [Gemini Omni Flash 1.1](/models/gemini-omni-flash-1-1) or [LTX-2.5 Fast](/models/ltx-2-5-fast).",
    ],
    prompt: {
      text: "A barista in a green apron pours latte art into a white cup, close-up. The camera slowly pulls back to reveal a busy morning café, warm window light, the hiss of the steam wand and quiet chatter.",
      note: "Seedance copes well with a camera move that changes partway through. If you make follow-up shots, copy the barista's description word for word so she looks the same.",
    },
    faqs: [
      {
        q: "How long can a Seedance 2.5 video be?",
        a: "Between 4 and 30 seconds per generation. To go longer, run the clip through Extend mode and keep adding to it.",
      },
      {
        q: "Can Seedance 2.5 edit an existing video?",
        a: "Yes. Attach the clip, choose Edit, and describe the change, such as “replace the grey sky with a sunset, keep everything else the same”. The [AI video editor](/ai-video-editor) opens with this set up.",
      },
      {
        q: "Is Seedance 2.5 good for ads?",
        a: "It's one of the best fits. It follows detailed briefs, keeps a product consistent from a reference photo, and can run long enough for a full ad in one clip.",
      },
    ],
    alternatives: [
      { slug: "wan-3-0", why: "A similar reference-heavy workflow at a lower price per second." },
      { slug: "gemini-omni-flash-1-1", why: "Cheap 360p drafts and 4K finals." },
      { slug: "minimax-h3", why: "Cinematic motion and output up to 1440p." },
    ],
    tools: ["/ai-video-editor", "/ai-video-extender", "/ai-ugc-video-generator", "/text-to-video"],
  },
  {
    id: WAN,
    slug: "wan-3-0",
    name: "Wan 3.0",
    maker: "Alibaba",
    title: "Wan 3.0 AI Video Generator – Specs, Prices & Tips",
    description:
      "Use Alibaba's Wan 3.0 online. Make video from text, images, video, audio, a document or a web page, with native sound and clips up to 30 seconds.",
    h1: "Wan 3.0: Alibaba's All-in-One AI Video Model",
    summary: "Takes text, images, video, audio, documents and web pages, with sound and clips up to 30 seconds.",
    intro:
      "Wan 3.0 is Alibaba's all-in-one video model. It accepts more kinds of input than anything else in the studio: text, images, video, audio, a document or even a web page. It's built for longer, reference-heavy work where characters and products have to stay consistent, and it generates sound along with the picture.",
    audio: true,
    strengths: [
      "Clips of 2 to 30 seconds, or let the model choose the length.",
      "Up to 10 reference images, 5 reference videos and 5 audio clips in one generation.",
      "Reads a document or a web page as context, which is handy for turning an article or a product page into a video.",
      "First and last frame control for image-to-video.",
      "Native audio, plus an optional prompt extender that fleshes out short prompts.",
      "Video-to-video, editing and extending as well as generating from scratch.",
    ],
    bestFor: [
      { title: "Explainers and product demos", body: "Point it at the page or the doc and describe the video you want." },
      { title: "Music-led sequences", body: "Reference audio sets the mood. See the [AI music video generator](/ai-music-video-generator)." },
      { title: "Recurring characters", body: "Reference images keep faces and outfits steady across a series of shots." },
      { title: "Scripts", body: "Long, multi-part prompts in [text to video AI](/text-to-video)." },
    ],
    limits: [
      "It tops out at 1080p.",
      "With lots of references, prompts get complicated. Start with one or two and add more only if you need them.",
      "Frame images can't be mixed with reference images, videos or audio in the same generation.",
      `[Wan 3.0 Prime](/models/wan-3-0-prime) gives the same results faster, for more money (${rate(WAN_PRIME, "720p")} vs ${rate(WAN, "720p")} a second at 720p).`,
    ],
    prompt: {
      text: "Turn the attached product page into a 10-second explainer: the bottle turns slowly on a marble counter while three short benefit lines appear on screen one after another. Clean studio light, soft upbeat music.",
      note: "Attach the page as a URL input with the + button. Wan uses it as context, so you don't have to paste the copy into the prompt.",
    },
    faqs: [
      {
        q: "What's the difference between Wan 3.0 and Wan 3.0 Prime?",
        a: `They're the same model with the same inputs and the same output quality. Prime runs on faster inference, so you wait less, and it costs more: from ${rate(WAN_PRIME, "480p")} a second against ${rate(WAN, "480p")} for Wan 3.0.`,
      },
      {
        q: "Can Wan 3.0 make videos with sound?",
        a: "Yes. Switch audio on and describe the sounds you want, from ambience to music, in the prompt.",
      },
      {
        q: "Can Wan 3.0 use a document or a website?",
        a: "Yes, one document or one URL per generation. It reads it as context for the video, which suits explainers and product videos.",
      },
    ],
    alternatives: [
      { slug: "wan-3-0-prime", why: "Same model and quality, generated faster." },
      { slug: "seedance-2-5", why: "Even bigger reference sets and precise edits." },
      { slug: "minimax-h3", why: "Reference-driven character work up to 1440p." },
    ],
    tools: ["/text-to-video", "/image-to-video", "/ai-music-video-generator", "/ai-video-editor"],
  },
  {
    id: WAN_PRIME,
    slug: "wan-3-0-prime",
    name: "Wan 3.0 Prime",
    maker: "Alibaba",
    title: "Wan 3.0 Prime – Faster Wan 3.0 AI Video Online",
    description:
      "Wan 3.0 Prime is the faster version of Alibaba's Wan 3.0: the same inputs and quality, shorter waits. See specs and prices, and when it's worth paying for.",
    h1: "Wan 3.0 Prime: The Same Wan 3.0, Generated Faster",
    summary: "Wan 3.0's inputs and quality on faster inference, for when waiting costs more than the credits.",
    intro:
      "Wan 3.0 Prime is the faster version of Alibaba's Wan 3.0. It's the same model, with the same inputs and the same output quality, running on quicker inference. You pay more per second and wait less, which matters when you're iterating on a client brief live or generating a lot of clips at once.",
    audio: true,
    strengths: [
      "Everything Wan 3.0 does: text, images, video, audio, a document or a web page as input.",
      "Shorter waits for the same result.",
      "Clips of 2 to 30 seconds, or let the model choose.",
      "Native audio and an optional prompt extender.",
      "First and last frames, reference images (up to 10), reference videos and audio (up to 5 each).",
    ],
    bestFor: [
      { title: "Deadline work", body: "Turn revisions around while the client is still on the call." },
      { title: "Batch generation", body: "Get through a long list of shots faster." },
      { title: "Live iteration", body: "Tweak a prompt and see the result sooner, without changing models." },
      { title: "Anything Wan 3.0 does", body: "The prompts and references you use with [Wan 3.0](/models/wan-3-0) work the same here." },
    ],
    limits: [
      "It costs more than Wan 3.0 for identical output. If you aren't in a hurry, use Wan 3.0.",
      "It tops out at 1080p.",
      "Frame images can't be mixed with reference images, videos or audio in the same generation.",
    ],
    prompt: {
      text: "Handheld shot following a chef through a busy restaurant kitchen during dinner service, flames flaring on the grill, plates sliding onto the pass, shouted orders and clattering pans.",
      note: "A good test of Prime's speed: run three or four variations of the camera move back to back and keep the best one.",
    },
    faqs: [
      {
        q: "Is Wan 3.0 Prime better quality than Wan 3.0?",
        a: "No. The quality is the same. Prime is only faster, and costs more for it.",
      },
      {
        q: "How much does Wan 3.0 Prime cost?",
        a: `${rate(WAN_PRIME, "480p")} a second at 480p, ${rate(WAN_PRIME, "720p")} at 720p and ${rate(WAN_PRIME, "1080p")} at 1080p. A 5-second 720p clip comes to about ${clip(WAN_PRIME, "720p", 5)}.`,
      },
    ],
    alternatives: [
      { slug: "wan-3-0", why: "Identical results for less, if you can wait a little longer." },
      { slug: "ltx-2-5-fast", why: "Fast and cheap, with output up to 4K." },
      { slug: "minimax-h3-fast", why: "Quick 480p drafts at one flat price." },
    ],
    tools: ["/text-to-video", "/image-to-video", "/ai-video-editor"],
  },
  {
    id: GEMINI,
    slug: "gemini-omni-flash-1-1",
    name: "Gemini Omni Flash 1.1",
    maker: "Google",
    title: "Gemini Omni Flash 1.1 AI Video – 360p to 4K Online",
    description:
      "Use Google's Gemini Omni Flash 1.1 online: cheap 360p drafts, 4K finals, native sound, start-to-end frames and scene extension. Specs and prices.",
    h1: "Gemini Omni Flash 1.1: Google's AI Video Model, From 360p Drafts to 4K",
    summary: "Native sound, 360p drafts to 4K finals, frame interpolation, editing and scene extension.",
    intro:
      "Gemini Omni Flash 1.1 is Google's video generation and editing model, and it's the default in our studio for a reason: it covers everything from a few-cent 360p test to a 4K final. It generates sound with the picture, can animate the transition between a start and an end frame, and can edit or extend clips you already have.",
    audio: true,
    strengths: [
      `Four output tiers: 360p drafts from ${rate(GEMINI, "360p")} a second, then 720p, 1080p and 4K.`,
      "Native, synchronized audio from the prompt.",
      "Start-to-end frame interpolation for smooth transitions between two images.",
      "Scene extension in steps of 3 to 10 seconds, up to 30 seconds in total.",
      "Reference-to-video with up to 7 images and 3 short video clips.",
      "Edits and extends videos you upload.",
    ],
    bestFor: [
      { title: "Testing prompts cheaply", body: `A 3-second 360p test costs about ${clip(GEMINI, "360p", 3)}, so you can try ideas freely.` },
      { title: "4K deliverables", body: "Render the final at 4K once the shot works." },
      { title: "Transitions", body: "Animate the move between two stills, like day to night or before and after." },
      { title: "Extending scenes", body: "Grow a short shot in the [AI video extender](/ai-video-extender)." },
    ],
    limits: [
      "Clips are 3 to 10 seconds per generation.",
      "Only two shapes: 16:9 and 9:16.",
      "It's billed per token, so per-second prices are close approximations, and input tokens add a little on top.",
      "Editing or extending a video costs more per second than generating from scratch.",
      "With an input video, use a resolution preset rather than an exact size.",
    ],
    prompt: {
      text: "A paper boat drifts down a rain-filled gutter, low angle at water level, city lights reflected in the ripples, raindrops pattering and distant traffic.",
      note: `Run it at 360p for 3 seconds first (about ${clip(GEMINI, "360p", 3)}). Once the motion is right, render it again at 1080p or 4K.`,
    },
    faqs: [
      {
        q: "Can Gemini Omni Flash make 4K video?",
        a: `Yes. It renders at 360p, 720p, 1080p or 4K. 4K costs ${rate(GEMINI, "4K")} a second, so an 8-second clip is about ${clip(GEMINI, "4K", 8)}.`,
      },
      {
        q: "Does Gemini Omni Flash generate sound?",
        a: "Yes. It creates synchronized audio from your prompt in the same pass as the picture. Describe the sounds you want.",
      },
      {
        q: "How much does a Gemini Omni Flash video cost?",
        a: `About ${clip(GEMINI, "360p", 3)} for a 3-second 360p test, ${clip(GEMINI, "1080p", 8)} for 8 seconds at 1080p and ${clip(GEMINI, "4K", 10)} for 10 seconds at 4K. The composer shows the estimate for your exact settings.`,
      },
    ],
    alternatives: [
      { slug: "ltx-2-5-fast", why: "Another route to 4K, with longer clips at HD." },
      { slug: "seedance-2-5", why: "Longer single clips, up to 30 seconds." },
      { slug: "flux-3-video", why: "Clean on-screen text and its own draft mode." },
    ],
    tools: ["/text-to-video", "/image-to-video", "/ai-video-extender", "/ai-video-editor"],
  },
  {
    id: LTX_25,
    slug: "ltx-2-5-fast",
    name: "LTX-2.5 Fast",
    maker: "Lightricks",
    title: "LTX-2.5 Fast AI Video Generator – Fast Drafts to 4K",
    description:
      "Use Lightricks' LTX-2.5 Fast online: quick generations from 720p to 4K, camera presets, first and last frames, and optional sound. Specs and prices.",
    h1: "LTX-2.5 Fast: Quick AI Video From 720p to 4K",
    summary: "Speed-focused, 720p to 4K, camera movement presets and optional native audio.",
    intro:
      "LTX-2.5 Fast is Lightricks' speed-focused video model. It turns prompts around quickly without dropping to low resolutions, going from 720p all the way to 4K. It's a good everyday model for iterating on an idea before you spend more on a premium render, and good enough for plenty of finals.",
    audio: true,
    strengths: [
      "Output at 720p, 1080p, 2K or 4K.",
      "Set lengths of 6 to 20 seconds in 2-second steps, or let it choose.",
      "Camera movement presets (dolly, jib and more), so you don't have to describe the move in words.",
      "First and last frame guidance, plus a reference image.",
      "Optional native audio.",
      "24, 25, 48 or 50 frames per second.",
    ],
    bestFor: [
      { title: "Drafts and storyboards", body: "Try lots of ideas fast, then re-run the winners on a bigger model." },
      { title: "Social and ad content", body: "Volume work for Reels, TikTok and Shorts." },
      { title: "Affordable 4K", body: `4K from ${rate(LTX_25, "4K")} a second.` },
      { title: "Photo animation", body: "Quick tests in the [AI image to video](/image-to-video) tool." },
    ],
    limits: [
      "At 2K or 4K, and at 48 or 50 fps, clips are at most 10 seconds.",
      "Only two shapes: 16:9 and 9:16.",
      "You can also drive it with an audio track and a reference image, but in that mode it renders at 1080p and ignores duration and camera settings.",
    ],
    prompt: {
      text: "A lighthouse on a rocky headland at golden hour, waves breaking below, seabirds circling, warm backlight, cinematic.",
      note: "Pick the “dolly in” camera preset rather than describing the move. The preset gives a steadier result.",
    },
    faqs: [
      {
        q: "Is LTX-2.5 Fast good enough for final videos?",
        a: "Often, yes, especially for social content. For hero shots with people, or anything that needs long-range consistency, it's worth re-rendering your best prompt on [Seedance 2.5](/models/seedance-2-5) or [Gemini Omni Flash 1.1](/models/gemini-omni-flash-1-1).",
      },
      {
        q: "Can LTX-2.5 Fast generate 4K?",
        a: `Yes, for clips of up to 10 seconds, at ${rate(LTX_25, "4K")} a second.`,
      },
    ],
    alternatives: [
      { slug: "ltx-2-3-fast", why: "Cheaper still, and built for audio-driven video." },
      { slug: "gemini-omni-flash-1-1", why: "Even cheaper 360p drafts, and 4K too." },
      { slug: "minimax-h3-max-turbo", why: "Low-cost 480p and 768p variations." },
    ],
    tools: ["/text-to-video", "/image-to-video"],
  },
  {
    id: LTX_23,
    slug: "ltx-2-3-fast",
    name: "LTX-2.3 Fast",
    maker: "Lightricks",
    title: "LTX-2.3 Fast – Low-Cost, Audio-Driven AI Video",
    description:
      `Use Lightricks' LTX-2.3 Fast online: HD video from ${rate(LTX_23, "720p")} a second, built around your own song or voice track, with custom sizes and frame rates.`,
    h1: "LTX-2.3 Fast: Low-Cost AI Video, Driven by Your Audio",
    summary: "Low-cost HD video, and the model to use when a song should drive the picture.",
    intro: `LTX-2.3 Fast is one of the cheapest ways to make HD video in the studio, from ${rate(LTX_23, "720p")} a second at 720p. It's also the one to pick when a song or voice track should drive the picture: attach an audio file and it generates the video around it, with your audio merged into the finished clip.`,
    audio: true,
    strengths: [
      "Audio-conditioned video: your track goes into the model, so the motion follows the music.",
      "Any length from 1 to 20 seconds.",
      "Custom sizes instead of fixed presets, up to 2K.",
      "Up to 10 frame images to guide the motion.",
      "Any frame rate from 1 to 120 fps.",
      "LoRA support and an optional prompt enhancer.",
    ],
    bestFor: [
      { title: "Music videos", body: "One clip per section of the song, in the [AI music video generator](/ai-music-video-generator)." },
      { title: "Lyric videos", body: "Short on-screen lines over visuals, in the [lyric video generator](/lyric-video-generator)." },
      { title: "Cheap drafts", body: "Test ideas at 720p for a few cents a clip." },
      { title: "Experiments", body: "Unusual frame rates, custom sizes and LoRA styles." },
    ],
    limits: [
      "It uses up to 30 seconds of audio per clip.",
      "Audio is attached by URL for now; direct audio upload isn't available yet.",
      "Quality is solid rather than premium. Re-render hero shots on a bigger model if they need it.",
      "It tops out at 2K.",
    ],
    prompt: {
      text: "Neon-lit city street at night seen from a moving car, rain on the windscreen, lights streaking past in time with the beat, 80s synthwave colours.",
      note: "Attach the track by URL with the + button, then generate one clip per section of the song and line them up in your editor.",
    },
    faqs: [
      {
        q: "How do I make a video from a song with LTX-2.3 Fast?",
        a: "Attach the audio file by URL, describe the visuals, and generate. The model uses up to 30 seconds of your track and merges it into the finished clip.",
      },
      {
        q: "How much does LTX-2.3 Fast cost?",
        a: `${rate(LTX_23, "720p")} a second at 720p, ${rate(LTX_23, "1080p")} at 1080p and ${rate(LTX_23, "2K")} at 2K. A 10-second 720p clip is about ${clip(LTX_23, "720p", 10)}.`,
      },
    ],
    alternatives: [
      { slug: "ltx-2-5-fast", why: "Higher resolutions, up to 4K, and camera presets." },
      { slug: "wan-3-0", why: "Reference audio alongside images and video." },
      { slug: "minimax-h3", why: "Native sound and audio references for character work." },
    ],
    tools: ["/ai-music-video-generator", "/lyric-video-generator", "/text-to-video"],
  },
  {
    id: H3,
    slug: "minimax-h3",
    name: "MiniMax H3",
    maker: "MiniMax",
    title: "MiniMax H3 AI Video Generator – Cinematic, Up to 1440p",
    description:
      "Use MiniMax H3 online: cinematic multi-shot video up to 1440p with native sound, plus image, video and audio references for consistent characters.",
    h1: "MiniMax H3: Cinematic AI Video Up to 1440p",
    summary: "Cinematic, reference-driven character work with native sound, up to 1440p.",
    intro:
      "MiniMax H3 is the full version of MiniMax's H3 video model, aimed at cinematic, multi-shot work. It renders at up to 1440p, generates sound natively, and takes images, videos and audio as references, so a character's face, voice and movement can stay consistent from one shot to the next.",
    audio: true,
    strengths: [
      "768p or 1440p output, the sharpest MiniMax tier.",
      "Up to 9 reference images, 3 reference videos and 3 audio references.",
      "Native, synchronized sound rather than a separate dubbing pass.",
      "First-frame and keyframe-guided generation.",
      "Can continue an existing clip or audio segment, and edit from instructions.",
    ],
    bestFor: [
      { title: "Character-driven scenes", body: "Keep a face and a voice consistent across shots." },
      { title: "Cinematic shots", body: "Film-like motion and framing at 1440p." },
      { title: "Music videos", body: "Audio references alongside an artist photo, for the [AI music video generator](/ai-music-video-generator)." },
      { title: "Continuations", body: "Pick up a clip where it ended, with the same voice." },
    ],
    limits: [
      "Clips are 5 to 15 seconds.",
      `The first ${h3Images.free} reference images are included; each one after that adds ${usd(h3Images.price)}. Reference video adds ${h3VideoInput} per second.`,
      "Frame images can't be mixed with reference images, videos or audio.",
      "With frame images, use a resolution preset rather than an exact size.",
    ],
    prompt: {
      text: "Close-up of an old jazz trumpeter on a smoky club stage, a single spotlight, he lifts the trumpet and plays a slow phrase, the crowd murmuring in the dark.",
      note: "Add a reference image of the musician, and a short voice or audio reference, to keep him consistent in later shots.",
    },
    faqs: [
      {
        q: "What's the difference between MiniMax H3, H3 Max, H3 Max Turbo and H3 Fast?",
        a: "H3 is the full model, with references and output up to 1440p. [H3 Max](/models/minimax-h3-max) and [H3 Max Turbo](/models/minimax-h3-max-turbo) are faster, cheaper versions that work from text or frames only. [H3 Fast](/models/minimax-h3-fast) is a quick 480p model that keeps reference support.",
      },
      {
        q: "Does MiniMax H3 generate sound?",
        a: "Yes, natively and in sync with the picture. It can also take audio references to keep a voice consistent.",
      },
    ],
    alternatives: [
      { slug: "minimax-h3-max", why: "Faster and cheaper, for image-to-video without references." },
      { slug: "seedance-2-5", why: "Longer clips and bigger reference sets." },
      { slug: "happyhorse-1-1", why: "Strong close-up performances and multi-character scenes." },
    ],
    tools: ["/text-to-video", "/image-to-video", "/ai-music-video-generator"],
  },
  {
    id: H3_MAX,
    slug: "minimax-h3-max",
    name: "MiniMax H3 Max",
    maker: "MiniMax",
    title: "MiniMax H3 Max – Expressive Image to Video AI",
    description:
      "Use MiniMax H3 Max online: expressive, cinematic motion from a prompt or a single photo, with optional first and last frames. Specs, prices and tips.",
    h1: "MiniMax H3 Max: Expressive Motion From a Single Image",
    summary: "Faster H3 for text and image-to-video, known for expressive, cinematic motion.",
    intro:
      "H3 Max is a performance-tuned version of MiniMax H3. It's quicker to generate, still follows prompts closely, and is known for expressive, cinematic motion from a single starting image, which makes it a favourite for image-to-video. Give it a portrait and it'll give you a performance.",
    audio: false,
    strengths: [
      "Text-to-video and image-to-video.",
      "Optional first and last frames for controlled motion between two images.",
      "Prompt following close to the full H3.",
      "480p or 768p output, in six shapes including 21:9.",
      "Clips of 5 to 15 seconds.",
    ],
    bestFor: [
      { title: "Portraits", body: "Expressive faces from a single photo in the [AI image to video](/image-to-video) tool." },
      { title: "Action from a still", body: "Turn one frame into dynamic, dramatic movement." },
      { title: "Before and after", body: "Animate between a first and a last frame." },
      { title: "Fast ideation", body: "Quicker turnaround than the full H3." },
    ],
    limits: [
      "No reference images, videos or audio. Use [MiniMax H3](/models/minimax-h3) for reference-driven work.",
      "It tops out at 768p.",
      "A resolution preset needs a frame image; for text-to-video, pick an exact size.",
    ],
    prompt: {
      text: "She looks up from her book, notices something off-camera, and breaks into a surprised laugh; soft window light, slow push-in.",
      note: "Upload the portrait as the first frame, and describe only what changes. The model can already see the photo.",
    },
    faqs: [
      {
        q: "Is MiniMax H3 Max good for image to video?",
        a: "It's one of the strongest here for it, especially for faces and expressive action from a single starting frame.",
      },
      {
        q: "How much does MiniMax H3 Max cost?",
        a: `${rate(H3_MAX, "480p")} a second at 480p and ${rate(H3_MAX, "768p")} at 768p, so a 5-second 768p clip is about ${clip(H3_MAX, "768p", 5)}.`,
      },
    ],
    alternatives: [
      { slug: "minimax-h3-max-turbo", why: "The same idea for less, when volume matters." },
      { slug: "grok-imagine-video-1-5", why: "Another image-to-video specialist, with speech." },
      { slug: "minimax-h3", why: "References and 1440p." },
    ],
    tools: ["/image-to-video", "/text-to-video"],
  },
  {
    id: H3_TURBO,
    slug: "minimax-h3-max-turbo",
    name: "MiniMax H3 Max Turbo",
    maker: "MiniMax",
    title: "MiniMax H3 Max Turbo – Low-Cost AI Video Online",
    description:
      "Use MiniMax H3 Max Turbo online: a faster, cheaper H3 Max with synchronized audio, for trying many variations at 480p or 768p. Specs and prices.",
    h1: "MiniMax H3 Max Turbo: H3 Max at High Volume",
    summary: "A distilled, lower-cost H3 Max with sound, for lots of variations.",
    intro: `H3 Max Turbo is a distilled, faster version of MiniMax H3 Max. It keeps most of H3 Max's prompt adherence and look at a lower price, from ${rate(H3_TURBO, "480p")} a second at 480p, which makes it one of the cheapest ways to try lots of variations. It also generates synchronized audio with the video.`,
    audio: true,
    strengths: [
      "From a prompt or an opening image, with an optional end frame.",
      "480p or 768p, in six shapes including 21:9.",
      "Synchronized audio generated with the video.",
      "An optional prompt expansion setting.",
      "Clips of 5 to 15 seconds.",
    ],
    bestFor: [
      { title: "Ad variations", body: "Test many hooks and settings cheaply before committing." },
      { title: "Social content at volume", body: "Lots of short clips without a big bill." },
      { title: "Prompt exploration", body: "Find the right wording before you switch to a premium model." },
      { title: "Interactive work", body: "Quick turnaround for live sessions." },
    ],
    limits: [
      "It tops out at 768p.",
      "No reference images, videos or audio, only frames.",
      "A little less detail than [MiniMax H3](/models/minimax-h3).",
    ],
    prompt: {
      text: "Handheld phone video: a teenager opens a pizza box on a sofa, steam rises, he grins at the camera, TV noise in the background.",
      note: "Run five or six variations with different openings, then take the winner to a premium model for the final.",
    },
    faqs: [
      {
        q: "How is H3 Max Turbo different from H3 Max?",
        a: "It's a distilled version: faster and cheaper, with most of H3 Max's prompt adherence and look. It also generates synchronized audio.",
      },
      {
        q: "How much does MiniMax H3 Max Turbo cost?",
        a: `${rate(H3_TURBO, "480p")} a second at 480p and ${rate(H3_TURBO, "768p")} at 768p, so a 5-second 480p clip is about ${clip(H3_TURBO, "480p", 5)}.`,
      },
    ],
    alternatives: [
      { slug: "minimax-h3-max", why: "A bit more quality for a bit more money." },
      { slug: "grok-imagine-video-1-5-lite", why: "Another low-cost model with native audio." },
      { slug: "ltx-2-5-fast", why: "Fast, and goes up to 4K." },
    ],
    tools: ["/ai-ugc-video-generator", "/text-to-video", "/image-to-video"],
  },
  {
    id: H3_FAST,
    slug: "minimax-h3-fast",
    name: "MiniMax H3 Fast",
    maker: "MiniMax",
    title: "MiniMax H3 Fast – Quick 480p AI Video With References",
    description:
      "Use MiniMax H3 Fast online: quick 480p clips at one flat price, with image, video and audio references for consistent drafts. Specs and tips.",
    h1: "MiniMax H3 Fast: Quick 480p Drafts With Reference Control",
    summary: "Quick 480p clips at one flat price, with image, video and audio references.",
    intro: `H3 Fast is MiniMax's quickest H3 model. It makes 480p clips of 4 to 15 seconds at one flat rate (${rate(H3_FAST, "480p")} a second), and unlike H3 Max Turbo it keeps reference support: combine your prompt with images, videos and audio to keep the look, the motion or a voice consistent while you draft.`,
    audio: false,
    strengths: [
      "One flat price at every size.",
      "Up to 9 reference images, 3 reference videos and 3 audio references.",
      "First and last frames for image-to-video.",
      "Clips of 4 to 15 seconds in six shapes, including 21:9.",
    ],
    bestFor: [
      { title: "Reference-driven drafts", body: "Check a character or product setup before rendering on [MiniMax H3](/models/minimax-h3)." },
      { title: "Batch previews", body: "Lots of quick versions of a shot." },
      { title: "Storyboards", body: "Rough out a sequence cheaply." },
      { title: "Interactive work", body: "Fast turnaround while you iterate." },
    ],
    limits: [
      "480p only.",
      "With frame images, the size follows the image (choose Auto).",
      "Frame images can't be combined with references.",
    ],
    prompt: {
      text: "The character from the reference image walks through a snowy forest at dusk, breath visible, lantern swinging, crunching footsteps.",
      note: "Use the same reference image you plan to use on H3 for the final, so the draft tells you something useful.",
    },
    faqs: [
      {
        q: "What resolution does MiniMax H3 Fast make?",
        a: "480p, in six shapes from 21:9 to 9:16. For sharper output, use [MiniMax H3](/models/minimax-h3) at 768p or 1440p.",
      },
      {
        q: "How much does MiniMax H3 Fast cost?",
        a: `A flat ${rate(H3_FAST, "480p")} a second, so a 5-second clip is about ${clip(H3_FAST, "480p", 5)}.`,
      },
    ],
    alternatives: [
      { slug: "minimax-h3", why: "The full model: 1440p and native sound." },
      { slug: "minimax-h3-max-turbo", why: "Cheaper still, without references." },
      { slug: "wan-3-0", why: "Even more inputs, up to 1080p." },
    ],
    tools: ["/text-to-video", "/image-to-video"],
  },
  {
    id: FLUX,
    slug: "flux-3-video",
    name: "FLUX 3 Video",
    maker: "Black Forest Labs",
    title: "FLUX 3 Video AI Generator – Text, Titles & Drafts",
    description:
      "Use FLUX 3 Video from Black Forest Labs online: 5 to 20 second clips with sound, clean on-screen text, multi-shot cuts and a cheap draft mode.",
    h1: "FLUX 3 Video: Black Forest Labs' AI Video Model",
    summary: "Clips with sound, clean on-screen text, multi-shot cuts and a cheap draft mode.",
    intro:
      "FLUX 3 Video is Black Forest Labs' video model, from the team behind the FLUX image models. It makes 5 to 20 second clips with synchronized audio and is unusually good at text inside the video, so titles and animated designs come out clean. A draft mode gives you a quick, low-resolution preview before you pay for full quality.",
    audio: true,
    strengths: [
      `Draft mode: a fast low-resolution preview at ${fluxDraft} a second, which you can then finalise at full quality.`,
      "Up to 10 keyframes to pin the opening image or guide motion through set points.",
      "Multi-shot sequences with hard cuts inside a single generation.",
      "Clean on-screen typography for titles and motion design.",
      "Native audio, including dialogue in several languages.",
      "Video-to-video, and wide shapes including about 21:9 and 2:1.",
    ],
    bestFor: [
      { title: "Titles and logo reveals", body: "Short text that needs to look sharp on screen." },
      { title: "Motion design", body: "Animated graphics and designed sequences." },
      { title: "Multi-shot scenes", body: "Several cuts in one generation." },
      { title: "Animation styles", body: "From camcorder footage to animation to photoreal." },
    ],
    limits: [
      `Video-to-video costs more: ${fluxVideoInput} a second at 720p.`,
      "Finalising a draft has no published price yet.",
      "It tops out at 1080p.",
      "Frame images and an input video can't be used together.",
    ],
    prompt: {
      text: "Bold white letters spelling “OPEN LATE” flicker on as a neon sign above a rainy diner entrance, then cut to a close-up of coffee being poured at the counter. Buzzing neon and rain.",
      note: "Turn on draft mode for the first few tries. When the timing works, finalise the draft at full quality.",
    },
    faqs: [
      {
        q: "Can FLUX 3 Video put text in a video?",
        a: "Yes, and it's one of its strengths. Put the exact words in quotes and describe the style. Short phrases work best.",
      },
      {
        q: "What is FLUX 3 Video's draft mode?",
        a: "A quick, low-resolution preview that costs less. If you like it, you finalise the draft at full quality instead of generating from scratch.",
      },
    ],
    alternatives: [
      { slug: "gemini-omni-flash-1-1", why: "Cheap 360p drafts and 4K finals." },
      { slug: "seedance-2-5", why: "Longer clips and precise edits." },
      { slug: "happyhorse-1-1", why: "Cinematic shot logic and close-up performances." },
    ],
    tools: ["/text-to-video", "/image-to-video", "/ai-video-editor", "/lyric-video-generator"],
  },
  {
    id: HAPPYHORSE,
    slug: "happyhorse-1-1",
    name: "HappyHorse 1.1",
    maker: "Alibaba",
    title: "HappyHorse 1.1 AI Video Generator – Specs & Prices",
    description:
      "Use Alibaba's HappyHorse 1.1 online for close-up performances and multi-character scenes, with up to 9 reference images at 720p or 1080p.",
    h1: "HappyHorse 1.1: Alibaba's AI Video Model for Performances",
    summary: "Close-up performances and multi-character scenes, with up to 9 reference images.",
    intro:
      "HappyHorse 1.1 is Alibaba's multimodal video model for text-to-video, image-to-video and reference-to-video. The 1.1 update improved motion continuity, character consistency, skin and facial detail, and shot logic, which makes it a good fit for close-up performances and scenes with more than one character.",
    audio: false,
    strengths: [
      "Up to 9 reference images for characters, outfits and props.",
      "720p and 1080p, in five shapes: 16:9, 9:16, 1:1, about 4:3 and about 3:4.",
      "Clips of 3 to 15 seconds.",
      "Cinematic shot logic and multi-character scenes.",
      "Detailed facial texture in close-ups.",
    ],
    bestFor: [
      { title: "Close-up performances", body: "Faces, expressions and dialogue moments." },
      { title: "Multi-character scenes", body: "Two or three people interacting in one shot." },
      { title: "Reference-driven series", body: "The same cast across several clips." },
      { title: "Story shots", body: "Scenes for a short film or a [text to video](/text-to-video) script." },
    ],
    limits: [
      "Text-to-video needs an exact size. With a first frame, use a resolution preset instead.",
      "A first frame is the only frame option (no last frame).",
      "It tops out at 1080p.",
    ],
    prompt: {
      text: "Two old friends sit across a kitchen table, one slides a faded photograph across, the other picks it up and smiles slowly; soft afternoon light, shallow depth of field, close-ups.",
      note: "Add a reference image for each person so both stay recognisable.",
    },
    faqs: [
      {
        q: "What is HappyHorse 1.1 best at?",
        a: "Close-up performances and scenes with several characters, where faces need to look right and stay consistent.",
      },
      {
        q: "How much does HappyHorse 1.1 cost?",
        a: `${rate(HAPPYHORSE, "720p")} a second at 720p and ${rate(HAPPYHORSE, "1080p")} at 1080p, so a 5-second 1080p clip is about ${clip(HAPPYHORSE, "1080p", 5)}.`,
      },
    ],
    alternatives: [
      { slug: "minimax-h3", why: "Character work with native sound and 1440p." },
      { slug: "seedance-2-5", why: "Longer, reference-heavy scenes." },
      { slug: "wan-3-0", why: "More input types and native audio." },
    ],
    tools: ["/text-to-video", "/image-to-video"],
  },
  {
    id: GROK,
    slug: "grok-imagine-video-1-5",
    name: "Grok Imagine Video 1.5",
    maker: "xAI",
    title: "Grok Imagine Video 1.5 – Image to Video AI With Voices",
    description:
      "Use xAI's Grok Imagine Video 1.5 online: lively image-to-video from one still, speech with up to three preset voices, 1 to 15 second clips.",
    h1: "Grok Imagine Video 1.5: xAI's Image to Video Model",
    summary: "Lively image-to-video from a single still, with speech in up to three preset voices.",
    intro:
      "Grok Imagine Video 1.5 is xAI's image-to-video model. Give it a still and it produces lively, cinematic motion from that single starting frame. It can also perform speech with up to three preset voices, which you place in your prompt.",
    audio: true,
    strengths: [
      "Built for image-to-video from a single starting frame.",
      "Speech with up to three preset voices.",
      "Up to 7 reference images, as an alternative to a first frame.",
      "Clips of 1 to 15 seconds.",
      "480p, 720p or 1080p, in seven shapes including 3:2 and 2:3.",
    ],
    bestFor: [
      { title: "Animating a still", body: "Characters, art and product shots in the [AI image to video](/image-to-video) tool." },
      { title: "Talking characters", body: "Give a character a voice and a line." },
      { title: "Short social clips", body: "Punchy motion in a few seconds." },
      { title: "Ads", body: "Product images brought to life for the [AI UGC video generator](/ai-ugc-video-generator)." },
    ],
    limits: [
      `Each input image adds ${grokImage}.`,
      "A first frame and reference images can't be used together.",
      "Without a first frame, pick an exact size.",
      `It costs more than [the Lite version](/models/grok-imagine-video-1-5-lite) (${rate(GROK, "720p")} vs ${rate(GROK_LITE, "720p")} a second at 720p).`,
    ],
    prompt: {
      text: "The fox in the illustration lifts its head, looks straight at the camera and says “You're late again,” then trots off into the autumn leaves.",
      note: "Choose a voice in the composer and reference it in the prompt where the line is spoken.",
    },
    faqs: [
      {
        q: "Can Grok Imagine Video 1.5 make characters talk?",
        a: "Yes. Pick up to three preset voices and reference them in your prompt, and the video includes the speech.",
      },
      {
        q: "What's the difference between Grok Imagine Video 1.5 and 1.5 Lite?",
        a: "The full version is aimed at image-to-video, takes reference images and supports preset voices. [Lite](/models/grok-imagine-video-1-5-lite) is the low-cost tier: text or a single starting frame, with native audio.",
      },
    ],
    alternatives: [
      { slug: "grok-imagine-video-1-5-lite", why: "The same family for much less." },
      { slug: "minimax-h3-max", why: "Expressive image-to-video motion." },
      { slug: "seedance-2-5", why: "Longer shots that stay true to the photo." },
    ],
    tools: ["/image-to-video", "/ai-ugc-video-generator"],
  },
  {
    id: GROK_LITE,
    slug: "grok-imagine-video-1-5-lite",
    name: "Grok Imagine Video 1.5 Lite",
    maker: "xAI",
    title: "Grok Imagine Video 1.5 Lite – Low-Cost AI Video",
    description:
      "Use xAI's Grok Imagine Video 1.5 Lite online: low-cost video with native audio from a prompt or one starting frame, 1 to 15 seconds, up to 1080p.",
    h1: "Grok Imagine Video 1.5 Lite: Low-Cost AI Video With Sound",
    summary: `The low-cost Grok tier: native audio from a prompt or one frame, from ${rate(GROK_LITE, "480p")} a second.`,
    intro: `Grok Imagine Video 1.5 Lite is the low-cost tier of xAI's Grok Imagine Video 1.5. It makes video with native audio from a prompt or a single starting frame, anywhere from 1 to 15 seconds long, with prices starting at ${rate(GROK_LITE, "480p")} a second at 480p.`,
    audio: true,
    strengths: [
      `Very low prices: ${rate(GROK_LITE, "480p")} a second at 480p and ${rate(GROK_LITE, "720p")} at 720p.`,
      "Native audio with the video.",
      "Text-to-video or image-to-video from one starting frame.",
      "Any length from 1 to 15 seconds.",
      "Seven shapes, including 3:2 and 2:3.",
    ],
    bestFor: [
      { title: "Social clips at volume", body: "Lots of short videos without a big bill." },
      { title: "Ad variations", body: "Try many hooks before you spend on a premium render." },
      { title: "Prompt testing", body: "Check wording and motion cheaply." },
      { title: "Quick photo animation", body: "One frame in, a short clip with sound out." },
    ],
    limits: [
      "No reference images, only a single starting frame.",
      `1080p costs much more than 720p (${rate(GROK_LITE, "1080p")} vs ${rate(GROK_LITE, "720p")} a second).`,
      `Each starting image adds ${grokLiteImage}.`,
      "With a first frame, use Auto size or a resolution preset; without one, pick an exact size.",
    ],
    prompt: {
      text: "A golden retriever puppy tumbles into a pile of autumn leaves, leaves flying, happy barking, slow motion.",
      note: "Try it at 480p or 720p. At these prices you can afford a few versions and keep the best.",
    },
    faqs: [
      {
        q: "How much does Grok Imagine Video 1.5 Lite cost?",
        a: `${rate(GROK_LITE, "480p")} a second at 480p, ${rate(GROK_LITE, "720p")} at 720p and ${rate(GROK_LITE, "1080p")} at 1080p. A 6-second 720p clip is about ${clip(GROK_LITE, "720p", 6)}.`,
      },
      {
        q: "Does Grok Imagine Video 1.5 Lite have sound?",
        a: "Yes. It generates native audio with the video.",
      },
    ],
    alternatives: [
      { slug: "grok-imagine-video-1-5", why: "Reference images and preset voices." },
      { slug: "minimax-h3-max-turbo", why: "Another low-cost option with sound." },
      { slug: "ltx-2-3-fast", why: "Cheap HD with your own audio." },
    ],
    tools: ["/text-to-video", "/image-to-video"],
  },
];

export function modelPageBySlug(slug: string) {
  return modelPages.find((m) => m.slug === slug);
}

/** The model page path for an AIR id, if the model has one. */
export function modelPageHref(id: string) {
  const page = modelPages.find((m) => m.id === id);
  return page && `/models/${page.slug}`;
}
