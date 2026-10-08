import { modelPages } from "@/app/_seo/model-pages";
import { cheapestPerSecond, modelSpecs, usd } from "@/app/_seo/models";
import type { ToolContent } from "@/app/_seo/tool-page";
import { TIERS } from "@/lib/plans";

/**
 * Copy for the tool landing pages (keyword plan: ai-video-keyword-plan.md, section 4).
 * Each page puts its primary keyword in the title, H1, URL and first paragraph.
 * [text](/path) in any string becomes an internal link.
 *
 * Keep the claims true to the product: model names, inputs and limits come
 * from data/video/models; images and videos upload from the device, audio is attached by URL.
 * Generating always costs credits, so only sign-up is ever called free.
 *
 * Voice: plain and specific. Short sentences, real examples, honest about limits.
 */

const LTX_23_FAST = "lightricks:ltx@2.3-fast";
const SEEDANCE_25 = "bytedance:seedance@2.5";

/** A 3-second 360p test on Gemini Omni Flash, the studio's default model and settings. */
const QUICK_TEST = usd(3 * (modelSpecs.find((m) => m.name === "Gemini Omni Flash 1.1")?.fromPerSecond ?? cheapestPerSecond));
const LOWEST_PLAN = Math.min(...TIERS.map((t) => t.price.month));

/** "[Seedance 2.5](/models/seedance-2-5), … and [X](/models/x)": every model that generates sound. */
const audioModels = modelPages.filter((m) => m.audio).map((m) => `[${m.name}](/models/${m.slug})`);
const AUDIO_MODELS = `${audioModels.slice(0, -1).join(", ")} and ${audioModels.at(-1)}`;

/** One answer about cost, shared by every page, so it's changed in one place. */
const PRICING_FAQ = {
  q: "Is it free?",
  a: `Signing up is free, and so is looking around: every model, setting and tool is open before you pay anything. Generating a video costs credits, and the price depends on the model, the length and the resolution. The estimate sits next to the Generate button, so you always see it before you commit. A quick 3-second test at 360p on Gemini Omni Flash costs about ${QUICK_TEST}.`,
};

export const home: ToolContent = {
  path: "/",
  title: "AI Video Generator – Seedance, Wan, Gemini & More",
  description:
    "Make AI videos from text, photos or a song. Try Seedance, Wan, LTX, MiniMax and Gemini side by side, see each clip's price first, and keep the best take.",
  h1: "One AI Video Generator, Every Top Model",
  intro:
    "VideoGenEditor is an AI video generator that puts the best video models in one browser tab. Describe a shot, drop in a photo or attach a song, and you get back a clip with real motion, camera moves and, on most models, sound. Not sure which model suits the idea? Run the same prompt through a few and keep the one you like. You'll see what each clip costs before you press Generate.",
  preset: {},
  howTo: {
    title: "How to make an AI video in three steps",
    steps: [
      {
        title: "Describe the shot",
        body: "Say what happens, where, and how the camera sees it: “a cyclist rides through a puddle on a wet city street at dusk, low tracking shot.” One scene per clip works best.",
      },
      {
        title: "Add a photo or audio (optional)",
        body: "Upload a picture to animate, add reference images to keep a character or product looking the same, or attach a track by URL to drive the visuals.",
      },
      {
        title: "Pick a model and generate",
        body: "Choose the model, the shape and the length, check the price next to the button, and generate. The finished clip lands in your workspace gallery.",
      },
    ],
  },
  sections: [
    {
      title: "Why use more than one AI video model?",
      paragraphs: [
        "Every video model has its own strengths. One keeps a face steady through a 30-second scene, another is great with fast camera work, another renders in 4K. Most AI video makers give you one model and a subscription. Here you switch models from the same prompt box and your prompt and attachments come with you, so comparing two models takes a click, not two accounts.",
      ],
      bullets: [
        "Seedance 2.5 (ByteDance): long, continuous scenes of up to 30 seconds that keep subjects consistent. It can also edit or extend clips you already have.",
        "Wan 3.0 and Wan 3.0 Prime (Alibaba): take text, images, video and audio as input, and generate sound along with the picture.",
        "LTX-2.5 Fast and LTX-2.3 Fast (Lightricks): quick, cheap drafts of up to 20 seconds. LTX-2.3 can build a video around your own audio.",
        "MiniMax H3 (Fast, Max and Max Turbo): cinematic movement from a prompt or a single starting frame.",
        "Gemini Omni Flash 1.1 (Google): anything from cheap 360p tests to 4K, plus scene extension and start-to-end frame interpolation.",
        "FLUX 3 Video, HappyHorse 1.1 and Grok Imagine Video 1.5, for other looks and more image-to-video options.",
      ],
    },
    {
      title: "What you can make",
      paragraphs: [
        "Got a script? [Text to video AI](/text-to-video) turns it into scenes, one shot at a time. Got a photo? The [AI image to video](/image-to-video) generator brings it to life. Already filmed something? Change it with a sentence in the [AI video editor](/ai-video-editor), or keep it going past the last frame with the [AI video extender](/ai-video-extender).",
        "Musicians can build visuals around a track with the [AI music video generator](/ai-music-video-generator), or put the words on screen with the [lyric video generator](/lyric-video-generator). If you sell something, the [AI UGC video generator](/ai-ugc-video-generator) turns a product photo into creator-style ads for TikTok, Reels and Shorts.",
      ],
    },
    {
      title: "What's different here",
      bullets: [
        "You see the price first. Every model shows an estimate for your exact settings before you generate, so credits don't quietly disappear.",
        "Failed generations aren't charged.",
        "It fits wherever you post: 16:9 for YouTube, 9:16 for TikTok, Reels and Shorts, 1:1 for feeds, and more depending on the model.",
        "Sound comes in the same pass. Many models generate ambience and sound effects along with the picture.",
        "Workspaces keep each client or project separate, and you can invite teammates as admins or members.",
        "Nothing to install. It runs in the browser, so you don't need a powerful GPU.",
      ],
    },
    {
      title: "Tips for better AI videos",
      paragraphs: [
        "Write your prompt the way a director briefs a camera operator: “A slow dolly-in on a ceramic mug on a sunlit kitchen table, steam rising, shallow depth of field, warm morning light.” Name the camera move, the light and the style. Ask for one action per clip. If you need a sequence, make each shot on its own and cut them together.",
        "Draft cheaply. Test the idea at 360p or 720p, and only render the final at 1080p or 4K once the shot works. Our guide on [how to make an AI video](/blog/how-to-make-ai-video) goes into more detail.",
      ],
    },
  ],
  models: {
    title: "AI video models compared",
    intro:
      "Every model in the studio side by side: the longest clip it makes in one go, its top resolution, its lowest price per second and what you can start from. Higher resolutions cost more, and the composer always shows the exact estimate for your settings.",
  },
  useCases: {
    title: "What people make with it",
    items: [
      { title: "Social clips", body: "Vertical videos for TikTok, Reels and YouTube Shorts, with no shoot and no stock footage." },
      { title: "Ads and product videos", body: "A product photo becomes a moving ad. The [AI UGC video generator](/ai-ugc-video-generator) is set up for exactly that." },
      { title: "Music visuals", body: "Music videos, visualizers and lyric videos built around your own track." },
      { title: "Storyboards and pitches", body: "Show a client what a scene will look like before anyone books a camera." },
    ],
  },
  faqs: [
    PRICING_FAQ,
    {
      q: "What is the best AI video generator?",
      a: "Honestly, it depends on the shot. Seedance 2.5 is great for long, consistent scenes. LTX-2.5 Fast is quick and cheap for drafts. Gemini Omni Flash goes all the way to 4K. Since they're all here, the practical answer is to run your prompt through two or three and keep the best. For the wider market, see our [best free AI video generators](/blog/best-free-ai-video-generators) roundup.",
    },
    {
      q: "How long can an AI video be?",
      a: "Most models make 5 to 20 seconds per generation. Seedance 2.5 goes up to 30 seconds in a single clip, and the [AI video extender](/ai-video-extender) can keep any clip going. For anything longer, make several shots and edit them together.",
    },
    {
      q: "Can I use AI-generated videos commercially?",
      a: "Generally, yes. You can use what you generate in your own projects, paid work included, under each model provider's terms. Steer clear of prompts that copy real people, brands or copyrighted characters.",
    },
    {
      q: "How much does an AI video cost?",
      a: `You pay per second of video, at a rate set by the model and the resolution. Prices start at ${usd(cheapestPerSecond)} a second, so a 5-second draft can cost around ${usd(cheapestPerSecond * 5)}. 1080p and 4K on premium models cost more. Credits come with [plans](/pricing) from $${LOWEST_PLAN} a month or as a one-time top-up. They never expire, and failed generations aren't charged.`,
    },
    {
      q: "Which AI video generators make videos with sound?",
      a: `${AUDIO_MODELS} can all generate synchronized audio (ambience, sound effects and short spoken lines) in the same pass as the picture. Just describe the sound you want in the prompt.`,
    },
    {
      q: "Can I make 4K AI videos?",
      a: "Yes. Gemini Omni Flash 1.1 and LTX-2.5 Fast go up to 4K, LTX-2.3 Fast up to 2K and MiniMax H3 up to 1440p. Most other models top out at 720p or 1080p. 4K costs more per second, so it's worth drafting at a lower resolution first.",
    },
    {
      q: "Is VideoGenEditor an alternative to Sora, Veo or Kling?",
      a: "Sort of. Those are single models from single companies. VideoGenEditor gives you Seedance (ByteDance), Wan (Alibaba), Gemini Omni Flash (Google), MiniMax, LTX, FLUX and Grok in one place, and you pay per clip instead of per subscription. If one model can't get a shot right, you try another without signing up anywhere new. Our [best free AI video generators](/blog/best-free-ai-video-generators) guide covers how the others compare.",
    },
    {
      q: "Do I need to install anything?",
      a: "No. It runs in the browser on desktop and mobile. Sign in with Google and you're ready to go.",
    },
  ],
  related: ["/text-to-video", "/image-to-video", "/ai-video-editor", "/ai-music-video-generator"],
};

export const imageToVideo: ToolContent = {
  path: "/image-to-video",
  title: "Image to Video AI – Animate Any Photo Online",
  description:
    "Turn a photo into video with AI. Upload a picture, say how it should move, and animate it with Seedance, MiniMax, Grok or Gemini, right in your browser.",
  h1: "AI Image to Video Generator: Bring Any Photo to Life",
  intro:
    "Upload a photo and our AI image to video generator turns it into a moving clip. Tell it what should move (a slow zoom, hair catching the wind, a product turning on a table) and the model animates the picture while keeping it recognisably yours. Portraits, product shots, landscapes, artwork and old family photos all work.",
  preset: {
    placeholder: "Upload a photo (drop it here or use +), then describe how it should move…",
  },
  howTo: {
    title: "How to turn a photo into a video",
    steps: [
      {
        title: "Upload your image",
        body: "Drag a PNG, JPG or WebP (up to 10 MB) onto the prompt box, or paste it in. It becomes the first frame of your video.",
      },
      {
        title: "Describe the motion",
        body: "Say what moves and how: “She turns toward the camera and smiles, light breeze, slow push-in.” One action is plenty.",
      },
      {
        title: "Generate and download",
        body: "Pick a model and a length, check the price, and generate. The video keeps your photo's shape unless you choose another size.",
      },
    ],
  },
  sections: [
    {
      title: "Choose where the video starts and ends",
      paragraphs: [
        "Most image-to-video tools only take a starting picture. Several models here also take a last frame, so you can upload two images and let the AI fill in the movement between them: a before-and-after, day turning into night, a box opening to show what's inside. Other models take reference images instead, which keep a character, outfit or product the same while the scene around it changes.",
      ],
    },
    {
      title: "Which model to use for image to video",
      bullets: [
        "LTX-2.5 Fast for quick, cheap tests of an idea, with clips of 6 to 20 seconds.",
        "Seedance 2.5 when faces, products and small details have to stay true to the photo, even in longer shots.",
        "MiniMax H3 Max for expressive, cinematic motion from a single first frame.",
        "Grok Imagine Video 1.5, which is built for image-to-video and gives lively movement from one picture.",
        "Gemini Omni Flash 1.1 for start-to-end frame interpolation and output up to 4K.",
      ],
    },
    {
      title: "Tips for better results",
      bullets: [
        "Start with a sharp, well-lit photo. The AI can't add detail that isn't there.",
        "Describe the motion, not the picture. The model can already see the photo, so spend your words on what changes.",
        "Match the shape to where you'll post. Vertical photos make good 9:16 Reels and Shorts.",
        "For portraits, small movements look most natural: a blink, a breath, a slight turn of the head.",
        "Want the shot to keep going? Send the result to the [AI video extender](/ai-video-extender).",
      ],
    },
    {
      title: "Photo to video AI vs. a slideshow",
      paragraphs: [
        "A slideshow pans and zooms across still images. Photo to video AI draws new frames, so people blink and turn, water flows and the camera moves through the scene. Starting from words instead? Try [text to video AI](/text-to-video). Want the motion to follow a song? Use the [AI music video generator](/ai-music-video-generator).",
      ],
    },
  ],
  useCases: {
    title: "What people animate",
    items: [
      { title: "Portraits and old photos", body: "Gentle, natural motion for family photos, often for [an AI tribute video](/blog/how-to-make-ai-video)." },
      { title: "Product shots", body: "Turn a packshot into a rotating hero clip for a store page or an ad." },
      { title: "Art and illustrations", body: "Animate paintings, character art and AI images without losing their style." },
      { title: "Real estate and travel", body: "Add a slow camera glide and drifting clouds to still photos of places." },
    ],
  },
  faqs: [
    PRICING_FAQ,
    {
      q: "How do I turn a picture into a video with AI?",
      a: "Drop the picture into the prompt box, describe the motion you want, pick a model and press Generate. Your image becomes the first frame and the AI creates the movement from there.",
    },
    {
      q: "What image formats can I upload?",
      a: "PNG, JPEG and WebP files up to 10 MB each. Bigger images can be attached by URL.",
    },
    {
      q: "Can I control the last frame too?",
      a: "Yes. With models that support frame images, you can mark an image as the first or the last frame, and the AI animates the change between them.",
    },
    {
      q: "Will the face in my photo stay the same?",
      a: "Today's models are good at keeping a person recognisable, especially Seedance 2.5 and MiniMax H3 Max. Small, natural movements keep faces most accurate. Big turns and fast action leave the model more to invent.",
    },
    {
      q: "Can I animate old family photos?",
      a: "Yes, and it's one of the most popular uses. Scan prints at high resolution, ask for small movements like a smile or a slow blink, and keep clips short. Our guide on [how to make an AI video](/blog/how-to-make-ai-video) has a section on tribute videos.",
    },
  ],
  related: ["/", "/text-to-video", "/ai-video-extender", "/ai-ugc-video-generator"],
};

export const textToVideo: ToolContent = {
  path: "/text-to-video",
  title: "Text to Video AI – Turn Any Script Into Video",
  description:
    "Type a prompt or paste a script and text to video AI turns it into a scene, with sound on many models. Compare Seedance, Wan, LTX, MiniMax and Gemini.",
  h1: "Text to Video AI: Turn a Script Into Video",
  intro:
    "Write a sentence or paste a script, and text to video AI builds the scene: the characters, the setting, the camera moves and, on many models, the sound. Try the same prompt on a few leading video models and keep the take that looks most like the one in your head.",
  preset: {
    placeholder: "Describe the scene: who, what happens, where, camera move, lighting, style…",
  },
  howTo: {
    title: "How to turn text into a video",
    steps: [
      {
        title: "Write your prompt",
        body: "Describe one scene: who's in it, what happens, where, how the camera moves and the mood. For a script, go one shot at a time.",
      },
      {
        title: "Choose the format",
        body: "Pick a model, the shape (16:9, 9:16, 1:1 and more) and the length. If the model can generate audio, turn it on.",
      },
      {
        title: "Generate and refine",
        body: "Check the price and press Generate. Not quite right? Change a few words or try another model.",
      },
    ],
  },
  sections: [
    {
      title: "From script to video, one shot at a time",
      paragraphs: [
        "A video model makes one continuous shot per generation, usually 5 to 20 seconds, and up to 30 with Seedance 2.5. So to turn a full script into a video, break it into shots the way a storyboard artist would: a wide establishing shot, a close-up, a reaction. Give each shot its own prompt, copy your character descriptions word for word between them, and cut the clips together in your editor.",
        "To keep a character or product looking the same from shot to shot, add a reference image. Seedance 2.5, Wan 3.0 and MiniMax H3 all use reference images to hold faces, outfits and objects steady.",
      ],
    },
    {
      title: "How to write a text to video prompt",
      paragraphs: ["A good prompt answers a handful of questions. Here's one built up piece by piece:"],
      bullets: [
        "Who or what: a few specific details go a long way (“a red-haired cyclist in a yellow rain jacket”).",
        "What happens: one clear movement (“rides through a puddle, water splashing”).",
        "Where and when: “a narrow Amsterdam street at dusk, wet cobblestones”.",
        "The camera: “low-angle tracking shot”, “slow dolly-in”, “drone flyover”.",
        "Style and light: “cinematic, 35mm film grain, neon reflections”.",
        "Sound, on models with audio: “rain, distant traffic, a bicycle bell”.",
      ],
    },
    {
      title: "Which model suits your text",
      paragraphs: [
        "Test the idea cheaply first, with LTX-2.5 Fast or a 360p run on Gemini Omni Flash, then run the prompt that works on a higher-end model. Seedance 2.5 handles long, multi-part instructions well and holds a scene together. Wan 3.0 can also read a document or a web page as context, which helps when you're turning an article into an explainer. Gemini Omni Flash 1.1 goes up to 4K when you need every detail.",
        "Would you rather start from a picture? Use the [AI image to video](/image-to-video) generator. Need to change a clip afterwards? Open it in the [AI video editor](/ai-video-editor).",
      ],
    },
  ],
  useCases: {
    title: "What you can make from text",
    items: [
      { title: "Faceless YouTube and Shorts", body: "Visuals for narrated videos, one prompt per line of your script." },
      { title: "Explainers", body: "Show a concept, a process or a place without hunting for stock footage." },
      { title: "Ads and promos", body: "Quick concept ads. For product-led ads, see the [AI UGC video generator](/ai-ugc-video-generator)." },
      { title: "Storyboards and pre-viz", body: "Preview the scenes of a film or a pitch before the shoot." },
    ],
  },
  faqs: [
    PRICING_FAQ,
    {
      q: "What is text to video AI?",
      a: "It's a video model that works from a written description. You describe the scene and it creates every frame: the motion, the lighting and the camera movement.",
    },
    {
      q: "Can I turn a whole script into a video?",
      a: "Yes, shot by shot. Each generation is one continuous clip, so split the script into scenes, generate each one, and edit them together. Keep character descriptions identical, or use a reference image, so people look the same throughout.",
    },
    {
      q: "Does the AI add sound?",
      a: "Several models can, including Seedance 2.5, Wan 3.0, LTX-2.5 and FLUX 3 Video. They generate ambience and sound effects in the same pass as the picture. Describe the sounds you want in the prompt.",
    },
    {
      q: "How long does it take to generate a video?",
      a: "Anywhere from under a minute to a few minutes, depending on the model, the length and the resolution. Fast models like LTX-2.5 Fast come back quickest.",
    },
  ],
  related: ["/", "/image-to-video", "/ai-video-editor", "/ai-video-extender"],
};

export const lyricVideo: ToolContent = {
  path: "/lyric-video-generator",
  title: "AI Lyric Video Generator – Make a Lyric Video Online",
  description:
    "Make a lyric video with AI. Attach your song, describe the look and the line to show, and get visuals that move with the music, sized for YouTube or Reels.",
  h1: "AI Lyric Video Generator: Visuals That Move With Your Song",
  intro:
    "Our lyric video generator turns your song into visuals that move with the music. Attach the track, describe the look, and write the lyric you want on screen. The AI generates a clip with your audio as an input, in the right shape for YouTube, Spotify Canvas, TikTok or Reels.",
  preset: {
    modelId: LTX_23_FAST,
    placeholder:
      "Attach your song with + (audio URL), then describe the visuals and the lyric line to show, in quotes…",
  },
  howTo: {
    title: "How to make a lyric video with AI",
    steps: [
      {
        title: "Attach your song",
        body: "Add the audio by URL with the + button. LTX-2.3 Fast uses up to 30 seconds of audio to drive the video, so pick a verse or the hook.",
      },
      {
        title: "Describe the visuals and the words",
        body: "Set the scene and the type: “Bold white text reading ‘we were golden’ fades in over slow-motion city lights, 80s synthwave style.”",
      },
      {
        title: "Go section by section",
        body: "Make one clip per lyric line or section, then line the clips up with your track in any editor.",
      },
    ],
  },
  sections: [
    {
      title: "Visuals that feel like your song",
      paragraphs: [
        "A good lyric video matches the song's energy: slow, dreamy imagery for a ballad, fast cuts and bold colour for a drop. Because your audio goes into the model, the motion follows the music instead of just sitting on top of it. The audio is also merged into the finished clip and trimmed to its length, so each clip already plays with your track.",
      ],
    },
    {
      title: "Getting clean text on screen",
      paragraphs: [
        "Video models can write short text on screen, but they do best with a few words at a time. Put the exact words in quotes, keep each clip to one short line, and describe the lettering (“bold sans-serif”, “handwritten neon”). For long verses, it's easier to generate the background here and add the full lyrics as captions in your editor. That's what a lot of artists do, and it keeps every word readable.",
      ],
      bullets: [
        "Quote the exact lyric: “the text ‘hold on’ appears in the sky”.",
        "Keep it to one line per clip, two to six words.",
        "Name a style: kinetic typography, handwritten, neon sign, film subtitle.",
        "Keep the background calm behind the words so they stay easy to read.",
      ],
    },
    {
      title: "Lyric video styles to try",
      bullets: [
        "Kinetic typography: words that slide, bounce or scale to the beat over abstract motion.",
        "Aesthetic loops: vintage film, rain on glass or a night drive behind the words.",
        "Anime and illustrated worlds that follow the story of the song.",
        "Visualizer style: particles, waves and light that pulse with the audio.",
      ],
    },
    {
      title: "Pair it with a full music video",
      paragraphs: [
        "Want scenes rather than words? The [AI music video generator](/ai-music-video-generator) uses the same audio-to-video approach for performance shots and story scenes. You can also animate your cover art with the [AI image to video](/image-to-video) tool and use that as the lyric video background.",
      ],
    },
  ],
  useCases: {
    title: "Who makes lyric videos here",
    items: [
      { title: "Independent artists", body: "A release-day lyric video for YouTube without hiring an animator." },
      { title: "Spotify Canvas and Shorts", body: "Short vertical loops with the hook on screen." },
      { title: "Producers and labels", body: "Quick visuals to find out which track or hook lands on social." },
      { title: "Covers and fan content", body: "Lyric clips for covers and remixes, in whatever style you describe." },
    ],
  },
  faqs: [
    PRICING_FAQ,
    {
      q: "How do I make a lyric video with AI?",
      a: "Attach your song by URL, describe the visuals and the lyric line to show (in quotes), choose a model that takes audio, such as LTX-2.3 Fast, and generate. Repeat for each section of the song and join the clips.",
    },
    {
      q: "Can the AI write out all my lyrics accurately?",
      a: "Short lines come out best. For full verses, generate the visuals here and add the lyrics as captions in your editor, so the timing and spelling are exactly right.",
    },
    {
      q: "How much of my song can I use?",
      a: "Up to 30 seconds of audio per clip with LTX-2.3 Fast. For a longer lyric video, make several clips and join them.",
    },
    {
      q: "Can I upload an MP3 file?",
      a: "Not yet. For now audio is attached by URL, for example a link to the file in your cloud storage.",
    },
  ],
  related: ["/ai-music-video-generator", "/image-to-video", "/text-to-video", "/"],
};

export const musicVideo: ToolContent = {
  path: "/ai-music-video-generator",
  title: "AI Music Video Generator – Turn Your Song Into Video",
  description:
    "Make a music video from your track with AI. Attach the song, describe the scenes, and get visuals generated around your audio. See each clip's price first.",
  h1: "AI Music Video Generator: Make a Video From Your Song",
  intro:
    "This AI music video generator makes visuals from your audio. Attach a track, describe the world you're picturing (a neon city, a desert road, an animated dreamscape) and the model generates video with your music as an input, with the song already on the clip. Build a full music video scene by scene, without a crew or a production budget.",
  preset: {
    modelId: LTX_23_FAST,
    placeholder: "Attach your track with + (audio URL), then describe the scene and the mood…",
  },
  howTo: {
    title: "How to make a music video from audio",
    steps: [
      {
        title: "Attach your audio",
        body: "Add your track by URL with the + button. Choose a section of up to 30 seconds: the intro, a verse, the chorus or the drop.",
      },
      {
        title: "Describe the scene",
        body: "Write the visuals and the energy: “Slow-motion dancer in a flooded warehouse, strobe light on the beat, blue and magenta haze.”",
      },
      {
        title: "Generate and assemble",
        body: "Make a clip for each section and line them up on your timeline. Need a shot to last longer? Use the [AI video extender](/ai-video-extender).",
      },
    ],
  },
  sections: [
    {
      title: "Video made from your audio, not cut to it",
      paragraphs: [
        "Plenty of tools cut stock footage to a beat. An audio-to-video model is different: it generates new frames with your track as an input. LTX-2.3 Fast takes a single audio file and merges it with the video it makes. Wan 3.0, MiniMax H3 and Seedance 2.5 take reference audio alongside reference images and videos, which helps when you also want the artist to look the same in every scene.",
      ],
    },
    {
      title: "Ideas for AI music videos",
      bullets: [
        "Performance: the artist (from a reference photo) singing on a rooftop, a stage or a moving train.",
        "Story: a short narrative told across verse and chorus, one scene per section.",
        "Abstract: fluid shapes, particles and light that react to the rhythm.",
        "Animated: anime, claymation, watercolour or pixel-art worlds.",
        "Visualizer: a looping animation of your cover art, made with the [AI image to video](/image-to-video) tool.",
      ],
    },
    {
      title: "Keeping a full-length video coherent",
      paragraphs: [
        "Plan it like a director would. Write a one-line idea for each part of the song, and reuse the same character, colours and style words in every prompt. Upload a reference image of the artist or the main character so faces stay consistent. Make two or three versions of each section and keep the strongest. For words on screen, use the [lyric video generator](/lyric-video-generator).",
      ],
    },
    {
      title: "Looking for a free AI music video generator?",
      paragraphs: [
        "Free tools usually add a watermark, cap the resolution or tie you to one model. We don't give videos away either, to be upfront about it. But signing up is free, you can try several leading models, and you'll see each clip's price before you make it, so your money only goes on the shots you want. For a wider comparison, see our guide to the [best free AI video generators](/blog/best-free-ai-video-generators).",
      ],
    },
  ],
  useCases: {
    title: "Made for musicians and creators",
    items: [
      { title: "Release visuals", body: "A music video for YouTube on release day, without a production budget." },
      { title: "Short-form promo", body: "Vertical 9:16 clips of the hook for TikTok, Reels and Shorts." },
      { title: "Live show visuals", body: "Loops and backdrops for DJ sets and gigs." },
      { title: "Pitching a concept", body: "Show a director or a label your treatment as real moving images." },
    ],
  },
  faqs: [
    PRICING_FAQ,
    {
      q: "Can AI make a music video from my song?",
      a: "Yes. Attach your track, describe the visuals, and an audio-to-video model generates a clip with your music on it. Make one clip per section and edit them together for the full video.",
    },
    {
      q: "Which model should I use?",
      a: "Start with LTX-2.3 Fast. It takes an audio file directly and it's fast and cheap. For scenes with recurring characters, try Wan 3.0, MiniMax H3 or Seedance 2.5 with reference audio and a reference image.",
    },
    {
      q: "How long can each clip be?",
      a: "Audio-driven clips use up to 30 seconds of audio at a time. Clip length depends on the model; LTX-2.3 Fast makes clips of up to 20 seconds.",
    },
    {
      q: "Do I own the music video?",
      a: "Your music stays yours. You can use the generated visuals under each model provider's terms, including on YouTube and streaming platforms.",
    },
  ],
  related: ["/lyric-video-generator", "/image-to-video", "/ai-video-extender", "/"],
};

export const videoExtender: ToolContent = {
  path: "/ai-video-extender",
  title: "AI Video Extender – Make Any Video Longer",
  description:
    "Make a video longer with AI. Add seconds past the last frame that match the scene, light and motion. Works on AI clips and real footage alike.",
  h1: "AI Video Extender: Make Any Clip Longer",
  intro:
    "Our AI video extender picks up where your clip ends. Give it a video and a line about what happens next, and the model generates new footage that matches the scene, the lighting and the motion, so a 5-second shot can become 10, 20 or more. It works on AI-generated clips and on footage you filmed yourself.",
  preset: {
    modelId: SEEDANCE_25,
    settings: { operation: "extend" },
    placeholder: "Drop in the video to extend (or use +), then describe what happens next…",
  },
  howTo: {
    title: "How to extend a video with AI",
    steps: [
      {
        title: "Add your video",
        body: "Upload the clip (MP4, MOV, WebM and more) or paste a link. The extender opens with Seedance 2.5 in Extend mode.",
      },
      {
        title: "Describe what happens next",
        body: "Continue the action: “The car keeps driving into the tunnel, headlights sweeping the walls.” Or leave it blank and let the model carry on naturally.",
      },
      {
        title: "Generate and repeat",
        body: "Generate the extension. To go longer still, extend the new clip, a few seconds at a time.",
      },
    ],
  },
  sections: [
    {
      title: "Two ways to extend a video",
      bullets: [
        "Seedance 2.5 in Extend mode continues the clip past its original ending and keeps subjects and style consistent. It's the default here.",
        "Gemini Omni Flash 1.1 extends scenes in steps of 3 to 10 seconds, up to 30 seconds in total, with output up to 4K.",
      ],
      paragraphs: [
        "Switch models from the model picker and your prompt and video come along. If you'd rather change what's in the clip than add to it, switch Seedance to Edit mode or open the [AI video editor](/ai-video-editor).",
      ],
    },
    {
      title: "When a video lengthener helps",
      bullets: [
        "A generated clip ends before the movement does.",
        "Your B-roll is a few seconds shorter than the voice-over.",
        "A loop needs to hold a little longer before you cut away.",
        "A social edit needs more time on the final shot for text or a call to action.",
        "You want to grow a short AI shot into a longer scene for a story or a music video.",
      ],
    },
    {
      title: "Tips for seamless extensions",
      paragraphs: [
        "Describe a continuation, not a new scene. The smoothest extensions keep the camera moving the same way at the same speed. Big changes, like a new location or a hard cut, work better as a separate shot made with [text to video AI](/text-to-video). Extend in small steps and check each one. It's much easier to steer a story a few seconds at a time than in one long jump.",
      ],
    },
  ],
  useCases: {
    title: "Who uses the extender",
    items: [
      { title: "Editors", body: "Fill a gap in the timeline without a reshoot or slowing the footage down." },
      { title: "AI video creators", body: "Grow a great 5-second generation into a full scene." },
      { title: "Musicians", body: "Stretch a shot to fit a section of the song, alongside the [AI music video generator](/ai-music-video-generator)." },
      { title: "Marketers", body: "Add breathing room at the end of an ad for a logo or an offer." },
    ],
  },
  faqs: [
    PRICING_FAQ,
    {
      q: "How do I make a video longer with AI?",
      a: "Add your clip as the input video, describe what happens next, and generate. The AI adds new frames after the last one. Run it again on the result to keep going.",
    },
    {
      q: "How much longer can I make a video?",
      a: "Each extension adds a few seconds. Gemini Omni Flash 1.1 extends in steps of 3 to 10 seconds, up to 30 seconds in total. With Seedance 2.5 you can keep extending the newest clip.",
    },
    {
      q: "Can I extend a real (non-AI) video?",
      a: "Yes. Any clip you upload or link to works. Steady shots with clear motion give the best results.",
    },
    {
      q: "How do I add my video?",
      a: "Drop the file onto the prompt box or pick it with the + button, and it uploads to your workspace. MP4, MOV, WebM, MKV, AVI, MPEG, OGG and 3GP all work. You can also paste a link to a video that's already online.",
    },
  ],
  related: ["/ai-video-editor", "/text-to-video", "/image-to-video", "/"],
};

export const videoEditor: ToolContent = {
  path: "/ai-video-editor",
  title: "AI Video Editor Online – Edit Video With a Prompt",
  description:
    "Edit video by describing the change. Swap the sky, restyle a scene, add a sign or remove a distraction, right in your browser with Seedance, Wan and Gemini.",
  h1: "AI Video Editor: Edit Videos by Describing the Change",
  intro:
    "This AI video editor changes footage based on a sentence. Attach a clip and say what to change (“make it snow”, “turn it into an anime scene”, “add a neon sign that reads OPEN”) and the model edits the video while leaving the rest of the shot alone. There's no timeline, masking or keyframing to learn, and it all runs online in your browser.",
  preset: {
    modelId: SEEDANCE_25,
    settings: { operation: "edit" },
    placeholder: "Drop in the video to edit (or use +), then describe the change…",
  },
  howTo: {
    title: "How to edit a video with AI",
    steps: [
      {
        title: "Attach your clip",
        body: "Upload your clip or paste a link. The editor opens with Seedance 2.5 in Edit mode.",
      },
      {
        title: "Describe the edit",
        body: "Say what changes and what doesn't: “Replace the grey sky with a golden sunset; keep the people and the car unchanged.”",
      },
      {
        title: "Generate and compare",
        body: "Generate the edit, compare it with the original in your gallery, and tweak the wording if it needs it.",
      },
    ],
  },
  sections: [
    {
      title: "What you can do with an AI video editor",
      bullets: [
        "Change the setting: a new background, different weather, another season or time of day.",
        "Restyle it: turn footage into anime, claymation, watercolour or a film look.",
        "Add or remove things: a product in someone's hand, a sign on a wall, or something distracting taken out of frame.",
        "Add text to a video: titles, signs and short captions written into the scene itself.",
        "Change how a subject looks, such as an outfit, hair colour or material, while the motion stays the same.",
        "Keep a clip going: switch to Extend mode, or use the [AI video extender](/ai-video-extender).",
      ],
    },
    {
      title: "Models for editing video",
      paragraphs: [
        "Seedance 2.5 is built for precise edits that leave the rest of the shot alone, and switches between Edit and Extend with one setting. Gemini Omni Flash 1.1 edits and extends video with output up to 4K. Wan 3.0, MiniMax H3 and FLUX 3 Video take video as input for video-to-video restyling: your footage sets the motion and your prompt sets the new look.",
      ],
    },
    {
      title: "How to add text to a video with AI",
      paragraphs: [
        "Describe the text and where it should sit in the scene: “Add the words ‘Grand Opening’ in gold letters on the shop window.” AI-rendered text works best for short phrases of two to six words. For subtitles and long captions, a regular caption tool is still more accurate. Use AI edits for text that should look like it's part of the world.",
      ],
    },
    {
      title: "Is this the right AI video editor for you?",
      paragraphs: [
        "It won't replace your regular editor. If you need precise cuts, multi-track timelines and colour grading, keep using it, and come here for the jobs that used to need VFX: replacing skies, restyling shots, adding objects. Starting from nothing? Generate footage first with [text to video AI](/text-to-video) or the [AI image to video](/image-to-video) tool.",
      ],
    },
  ],
  useCases: {
    title: "Popular edits",
    items: [
      { title: "Social content", body: "Restyle one clip into several looks and A/B test them on Reels and TikTok." },
      { title: "Ads and product placement", body: "Put your product into existing footage. See the [AI UGC video generator](/ai-ugc-video-generator)." },
      { title: "Fixing shots", body: "Swap a dull sky, change the season, or remove something that shouldn't be there." },
      { title: "Creative projects", body: "Turn live action into animation for music videos and shorts." },
    ],
  },
  faqs: [
    PRICING_FAQ,
    {
      q: "What is an AI video editor?",
      a: "It's a tool that edits footage from written instructions. Instead of masking and keyframing, you describe the change and a video model generates the edited clip.",
    },
    {
      q: "Can I edit a video I shot on my phone?",
      a: "Yes. Upload it straight from your phone or computer (MP4 and MOV both work). Short, steady clips give the cleanest results.",
    },
    {
      q: "Can I add text to a video?",
      a: "Yes. Put the text in quotes and say where it should appear. Short phrases come out best; for long subtitles, use a caption tool.",
    },
    {
      q: "Is there a length limit for editing?",
      a: "It depends on the model. Most edits work on short clips, so split longer footage into shots and edit them one at a time.",
    },
  ],
  related: ["/ai-video-extender", "/text-to-video", "/image-to-video", "/ai-ugc-video-generator"],
};

export const ugcVideo: ToolContent = {
  path: "/ai-ugc-video-generator",
  title: "AI UGC Video Generator – Creator-Style Ads From a Photo",
  description:
    "Make UGC-style video ads with AI. Turn a product photo and a short brief into 9:16 creator-style clips for TikTok, Reels and Shorts, with no shoot needed.",
  h1: "AI UGC Video Generator for Ads",
  intro:
    "Our AI UGC video generator turns a product photo and a short brief into ads that look like a creator made them: unboxings, try-ons, reactions and demos, in vertical 9:16 for TikTok, Instagram Reels and YouTube Shorts. You can test a dozen ad ideas in an afternoon without booking creators or shipping product.",
  preset: {
    modelId: SEEDANCE_25,
    placeholder:
      "Upload your product photo, then describe the ad: “Handheld selfie video, a woman unboxes the serum at her bathroom counter and smiles…”",
  },
  howTo: {
    title: "How to make an AI UGC ad",
    steps: [
      {
        title: "Upload your product",
        body: "Add a clean product photo as a reference image so the product looks right in every shot.",
      },
      {
        title: "Write the brief",
        body: "Describe the person, the place and the moment: “Handheld phone video, a young man in a gym tastes the drink and nods, natural light.”",
      },
      {
        title: "Generate variations",
        body: "Choose 9:16, try several hooks and settings, and send the best ones to your ad account for testing.",
      },
    ],
  },
  sections: [
    {
      title: "Why use AI for UGC video ads",
      paragraphs: [
        "UGC works because it looks real and belongs in the feed. But hiring creators for every test is slow and expensive. With an AI video ad generator you can try dozens of hooks, settings and audiences first, then put real budget behind the ideas that win. Seedance 2.5 is especially good for ads: it follows detailed instructions, keeps your product consistent from a reference image, and makes clips of up to 30 seconds.",
      ],
    },
    {
      title: "UGC ad formats you can generate",
      bullets: [
        "Unboxing: hands open the package and reveal the product.",
        "Try-on or demo: the product in use at home, at the gym, in the office or outdoors.",
        "Reaction hook: a surprised or delighted first reaction in the first two seconds.",
        "Before and after: use a first and a last frame to show the change.",
        "Product in scene: your product added to lifestyle footage with the [AI video editor](/ai-video-editor).",
        "Hero spin: a rotating product shot made with the [AI image to video](/image-to-video) tool.",
      ],
    },
    {
      title: "Prompts that look like real UGC",
      bullets: [
        "Say “handheld phone video”, “selfie angle” or “filmed on an iPhone” for that casual, unpolished look.",
        "Use natural light and everyday places: kitchens, bathrooms, cars, gyms.",
        "Open with the hook. Put the most interesting moment at the start of the prompt.",
        "Turn on native audio and describe the background sound for extra realism.",
        "Use the same product photo as the reference in every variation.",
      ],
    },
    {
      title: "Use it responsibly",
      paragraphs: [
        "Generate fictional people, never real creators or celebrities, and don't show your product doing things it can't really do. Many ad platforms ask you to label AI-generated content, so check each network's policy before you publish.",
      ],
    },
  ],
  useCases: {
    title: "Who uses AI UGC ads",
    items: [
      { title: "DTC and e-commerce brands", body: "Test new hooks and angles every week without new shoots." },
      { title: "Performance agencies", body: "Deliver more creative variations per client, faster." },
      { title: "App marketers", body: "Show the lifestyle around an app with creator-style scenes." },
      { title: "Small businesses", body: "Make social ads without a video budget." },
    ],
  },
  faqs: [
    PRICING_FAQ,
    {
      q: "What is an AI UGC video generator?",
      a: "It's a tool that makes videos in the style of user-generated content (handheld, casual, creator-led) from a text brief and your product images, for use in social ads.",
    },
    {
      q: "Will my product look accurate?",
      a: "Add a clear product photo as a reference image. Seedance 2.5, Wan 3.0 and MiniMax H3 use reference images to keep products consistent. Still, check small details like logos and label text before you publish.",
    },
    {
      q: "What size are the videos?",
      a: "Choose 9:16 for TikTok, Reels and Shorts, 1:1 or 4:3 for feeds, or 16:9 for YouTube. The sizes on offer depend on the model.",
    },
    {
      q: "Can the person in the video speak?",
      a: "Models with native audio can generate background sound and short spoken lines you describe in the prompt. For an exact script, add a voice-over in your editor.",
    },
  ],
  related: ["/image-to-video", "/ai-video-editor", "/text-to-video", "/"],
};

/** Every tool page, so the studio can open with the preset of the page a visitor came from. */
export const tools = [home, imageToVideo, textToVideo, lyricVideo, musicVideo, videoExtender, videoEditor, ugcVideo];
