import { cheapestPerSecond, usd } from "@/app/_seo/models";
import type { ToolContent } from "@/app/_seo/tool-page";
import { TIERS } from "@/lib/plans";

/**
 * Copy for the tool landing pages (keyword plan: ai-video-keyword-plan.md, section 4).
 * Each page puts its primary keyword in the title, H1, URL and first paragraph.
 * [text](/path) in any string becomes an internal link.
 *
 * Keep the claims true to the product: model names, inputs and limits come
 * from data/video/models; images and videos upload from the device, audio is attached by URL.
 */

const LTX_23_FAST = "lightricks:ltx@2.3-fast";
const SEEDANCE_25 = "bytedance:seedance@2.5";

/** One answer about cost, shared by every page, so it's changed in one place. */
const PRICING_FAQ = {
  q: "Is it free?",
  a: "Signing up with Google is free, and you can open every model, setting and tool without paying anything. Each video you generate has a cost that depends on the model, the clip length and the resolution, and the composer shows that estimate next to the Generate button before you start, so you always know what a clip costs first.",
};

export const home: ToolContent = {
  path: "/",
  title: "AI Video Generator – Seedance, Wan, Gemini & More",
  description:
    "AI video generator with every top model in one studio: Seedance, Wan, LTX, MiniMax and Gemini. Turn text, images or audio into video, up to 4K. Free sign-up.",
  h1: "AI Video Generator: Every Top Model, From Text, Images or Audio",
  intro:
    "VideoGenEditor is an AI video generator that puts today's leading video models in one browser tab. Type a prompt, drop in a photo or attach a song, and get a finished clip with motion, camera moves and native sound. Sign up free, compare models side by side, and see what each video costs before you make it.",
  preset: {},
  howTo: {
    title: "How to make a video with AI in 3 steps",
    steps: [
      {
        title: "Describe the shot",
        body: "Write what should happen: the subject, the action, the setting, the camera and the mood. One clear scene per clip works best.",
      },
      {
        title: "Add images or audio (optional)",
        body: "Upload a photo to animate it, add reference images for style or characters, or attach a track by URL to drive the visuals.",
      },
      {
        title: "Pick a model and generate",
        body: "Choose a model, the aspect ratio and the length, check the estimated cost, and press Generate. Your clip appears in your workspace gallery.",
      },
    ],
  },
  sections: [
    {
      title: "One AI video maker, every leading model",
      paragraphs: [
        "Most AI video makers lock you into a single model. VideoGenEditor lets you switch between them from the same prompt box, so you can use the model that fits the shot instead of the one a subscription happens to include. Your prompt and attachments carry over when you change models, which makes side-by-side comparison quick.",
      ],
      bullets: [
        "Seedance 2.5 (ByteDance): long, continuous scenes of up to 30 seconds, strong subject consistency, and edit or extend modes for existing clips.",
        "Wan 3.0 and Wan 3.0 Prime (Alibaba): text, image, video and audio inputs, with native audio generation.",
        "LTX-2.5 Fast and LTX-2.3 Fast (Lightricks): quick, low-cost drafts up to 20 seconds, with audio-driven video on LTX-2.3.",
        "MiniMax H3 (Fast, Max and Max Turbo): cinematic motion from text or a first frame.",
        "Gemini Omni Flash 1.1 (Google): up to 4K output, scene extension and start-to-end frame interpolation.",
        "FLUX 3 Video, HappyHorse 1.1 and Grok Imagine Video 1.5 for more styles and image-to-video options.",
      ],
    },
    {
      title: "Everything you can make",
      paragraphs: [
        "The same studio covers every way of starting a video. Write a script and use [text to video AI](/text-to-video) to turn it into a scene. Upload a picture and use the [AI image to video](/image-to-video) generator to bring it to life. Already have footage? The [AI video editor](/ai-video-editor) changes a clip with a sentence, and the [AI video extender](/ai-video-extender) continues it past its last frame.",
        "Musicians can use the [AI music video generator](/ai-music-video-generator) to build visuals from a track, or the [lyric video generator](/lyric-video-generator) to put words on screen. Brands can use the [AI UGC video generator](/ai-ugc-video-generator) to turn product photos into ad-style clips for TikTok, Reels and Shorts.",
      ],
    },
    {
      title: "Why creators use VideoGenEditor",
      bullets: [
        "The cost is shown upfront. Every model shows an estimated price for your exact settings before you generate, with no surprise credit burn.",
        "It fits every platform, with 16:9 for YouTube, 9:16 for TikTok, Reels and Shorts, 1:1 for feeds, and more, depending on the model.",
        "Many models generate native audio, adding synchronized sound effects and ambience in the same pass.",
        "Workspaces keep projects organised. Keep clients or projects separate and invite teammates as admins or members.",
        "It runs in any browser, so there's nothing to install and no GPU needed.",
      ],
    },
    {
      title: "Tips for better AI videos",
      paragraphs: [
        "Write prompts the way a director briefs a camera operator: “A slow dolly-in on a ceramic mug on a sunlit kitchen table, steam rising, shallow depth of field, warm morning light.” Name the camera move, the lighting and the style. Keep one action per clip; if you need a sequence, generate each shot and join them. For more detail, read our guide on [how to make an AI video](/blog/how-to-make-ai-video).",
      ],
    },
  ],
  models: {
    title: "AI video models compared",
    intro:
      "Every model in the studio at a glance: the longest clip it makes in one generation, its highest resolution, its starting price per second of video, and what you can start from. Prices rise with resolution, and the composer shows the exact estimate for your settings.",
  },
  useCases: {
    title: "Popular uses",
    items: [
      { title: "Social media content", body: "Vertical clips for TikTok, Reels and YouTube Shorts in minutes, without a shoot." },
      { title: "Ads and product videos", body: "Turn a product photo into a moving ad. See the [AI UGC video generator](/ai-ugc-video-generator)." },
      { title: "Music and art", body: "Visuals for songs, visualizers and lyric videos driven by your own audio." },
      { title: "Storyboards and pitches", body: "Show a client or a team exactly what a scene will look like before anyone films it." },
    ],
  },
  faqs: [
    PRICING_FAQ,
    {
      q: "What is the best AI video generator?",
      a: "It depends on the shot. Seedance 2.5 is strong for long, consistent scenes; LTX-2.5 Fast is quick and inexpensive for drafts; Gemini Omni Flash goes up to 4K. Because VideoGenEditor has them all, you can try the same prompt on several and keep the best. Our [best free AI video generators](/blog/best-free-ai-video-generators) guide compares the wider market.",
    },
    {
      q: "How long can AI-generated videos be?",
      a: "Most models make clips of 5 to 20 seconds per generation. Seedance 2.5 supports native clips of up to 30 seconds, and you can make any clip longer with the [AI video extender](/ai-video-extender).",
    },
    {
      q: "Can I use the videos commercially?",
      a: "Each model is offered under its provider's terms, and in general you can use the videos you generate in your own projects, including commercial ones. Avoid prompts that copy real people, brands or copyrighted characters.",
    },
    {
      q: "How much does an AI video cost?",
      a: `You pay per second of video, at a rate set by the model and resolution. Rates start at ${usd(cheapestPerSecond)} a second, so a 5-second draft can cost about ${usd(cheapestPerSecond * 5)}, while 1080p and 4K clips on premium models cost more. Credits come with [plans](/pricing) from $${Math.min(...TIERS.map((t) => t.price.month))} a month or as a one-time purchase, they never expire, and failed generations aren't charged.`,
    },
    {
      q: "Which AI video generators make videos with sound?",
      a: "Seedance 2.5, Wan 3.0, FLUX 3 Video, LTX-2.5 Fast, LTX-2.3 Fast, Gemini Omni Flash 1.1 and Grok Imagine Video 1.5 Lite can generate synchronized audio (ambience, sound effects and short spoken lines) in the same pass as the picture. Describe the sound you want in the prompt.",
    },
    {
      q: "Can I make 4K AI videos?",
      a: "Yes. Gemini Omni Flash 1.1 and LTX-2.5 Fast output up to 4K, LTX-2.3 Fast goes up to 2K, and MiniMax H3 up to 1440p. Most other models make 720p or 1080p. Higher resolutions cost more per second, so many creators draft at 720p first.",
    },
    {
      q: "Is VideoGenEditor an alternative to Sora, Veo or Kling?",
      a: "It's a different approach. Instead of one company's model, VideoGenEditor gives you Seedance (ByteDance), Wan (Alibaba), Gemini Omni Flash (Google), MiniMax, LTX, FLUX and Grok in one place, with pay-per-clip pricing. If a single model doesn't suit a shot, you can try another without a new subscription. See our [best free AI video generators](/blog/best-free-ai-video-generators) guide for how other tools compare.",
    },
    {
      q: "Do I need to install anything?",
      a: "No. VideoGenEditor runs in the browser on desktop and mobile. Sign in with Google and start generating.",
    },
  ],
  related: ["/text-to-video", "/image-to-video", "/ai-video-editor", "/ai-music-video-generator"],
};

export const imageToVideo: ToolContent = {
  path: "/image-to-video",
  title: "AI Image to Video Generator – Free Online",
  description:
    "Turn any photo into video with AI. Upload an image, describe the motion, and animate photos online with Seedance, Wan, LTX and more. Free sign-up.",
  h1: "AI Image to Video Generator",
  intro:
    "Upload a photo and our AI image to video generator turns it into a moving clip. Describe the motion you want (a slow zoom, hair blowing in the wind, a product turning on a table) and the model animates your picture while keeping it recognisably yours. It works with portraits, product shots, landscapes, artwork and old family photos.",
  preset: {
    placeholder: "Upload a photo (drop it here or use +), then describe how it should move…",
  },
  howTo: {
    title: "How to convert a photo to video with AI",
    steps: [
      {
        title: "Upload your image",
        body: "Drag a PNG, JPG or WebP (up to 10 MB) onto the prompt box, or paste it. It becomes the first frame of your video.",
      },
      {
        title: "Describe the motion",
        body: "Say what moves and how: “She turns toward the camera and smiles, gentle breeze, slow push-in.” Keep it to one action.",
      },
      {
        title: "Generate and download",
        body: "Pick a model and a length, check the cost estimate, and generate. The video keeps your photo's aspect ratio unless you choose another size.",
      },
    ],
  },
  sections: [
    {
      title: "Animate photos with first and last frames",
      paragraphs: [
        "Most image-to-video tools only take a starting picture. Several models here also accept a last frame, so you can upload two images and let the AI video generator create the motion between them: a before-and-after, a day-to-night transition, or a product that opens up. Other models take reference images instead, which keep a character, outfit or product consistent while the scene around it changes.",
      ],
    },
    {
      title: "Which model to use for image to video",
      bullets: [
        "Use LTX-2.5 Fast for quick, low-cost tests of an idea, with clips of 6 to 20 seconds.",
        "Use Seedance 2.5 when faces, products and small details must stay true to the photo in longer shots.",
        "MiniMax H3 Max gives expressive, cinematic motion from a single first frame.",
        "Grok Imagine Video 1.5 is built for image-to-video, with lively movement from one picture.",
        "Gemini Omni Flash 1.1 offers start-to-end frame interpolation and up to 4K output.",
      ],
    },
    {
      title: "Tips for better results",
      bullets: [
        "Start from a sharp, well-lit image; the AI can't add detail that isn't there.",
        "Describe motion, not the picture. The model can already see the photo, so spend your words on what changes.",
        "Match the aspect ratio to where you'll post: vertical photos make great 9:16 Reels and Shorts.",
        "For subtle portrait animation, ask for small movements such as blinking, a breath or a slight head turn.",
        "Want the scene to continue? Send the result to the [AI video extender](/ai-video-extender).",
      ],
    },
    {
      title: "Photo to video AI vs. a slideshow",
      paragraphs: [
        "A slideshow pans across still images. An AI image to video generator creates new frames, so people blink and turn, water flows and cameras move through the scene. If you'd rather start from words alone, try [text to video AI](/text-to-video); if you want motion that follows a song, try the [AI music video generator](/ai-music-video-generator).",
      ],
    },
  ],
  useCases: {
    title: "What people animate",
    items: [
      { title: "Portraits and old photos", body: "Bring family photos to life with gentle, natural motion. A popular way to make [an AI tribute video](/blog/how-to-make-ai-video)." },
      { title: "Product shots", body: "Turn a packshot into a rotating hero clip for a store page or an ad." },
      { title: "Art and illustrations", body: "Animate paintings, character art and AI images while keeping their style." },
      { title: "Real estate and travel", body: "Add a slow camera glide and moving clouds to still photos of places." },
    ],
  },
  faqs: [
    PRICING_FAQ,
    {
      q: "How do I turn a picture into a video with AI?",
      a: "Upload the picture to the prompt box, describe the motion you want, choose a model and press Generate. The image becomes the first frame and the AI creates the movement.",
    },
    {
      q: "What image formats can I upload?",
      a: "PNG, JPEG and WebP files up to 10 MB each. Larger images can be attached by URL.",
    },
    {
      q: "Can I control the last frame too?",
      a: "Yes, with models that support frame images you can mark an image as the first or the last frame, and the AI animates the transition between them.",
    },
    {
      q: "Will the face in my photo stay the same?",
      a: "Modern models are good at keeping identity, especially Seedance 2.5 and MiniMax H3 Max. Small, natural movements keep faces most accurate; big turns and fast action give the model more to invent.",
    },
  ],
  related: ["/", "/text-to-video", "/ai-video-extender", "/ai-ugc-video-generator"],
};

export const textToVideo: ToolContent = {
  path: "/text-to-video",
  title: "Free Text to Video AI – Script to Video Generator",
  description:
    "Free text to video AI: type a prompt or paste a script and generate video with native audio. Compare Seedance, Wan, LTX, MiniMax and Gemini in one place.",
  h1: "Text to Video AI: Script to Video Generator",
  intro:
    "Write a sentence or paste a script, and our text to video AI generates the scene: characters, setting, camera movement and, on many models, synchronized sound. Sign up free, try the same prompt on several leading video models, and keep the version that matches your idea.",
  preset: {
    placeholder: "Describe the scene: who, what happens, where, camera move, lighting, style…",
  },
  howTo: {
    title: "How to turn text into a video",
    steps: [
      {
        title: "Write your prompt",
        body: "Describe one scene: subject, action, setting, camera and mood. For a script, take it one shot at a time.",
      },
      {
        title: "Choose the format",
        body: "Pick a model, the aspect ratio (16:9, 9:16, 1:1 and more) and the length. Turn on native audio if the model offers it.",
      },
      {
        title: "Generate and refine",
        body: "Check the estimated cost and press Generate. Adjust the wording or try another model until the shot is right.",
      },
    ],
  },
  sections: [
    {
      title: "From script to video, shot by shot",
      paragraphs: [
        "AI video models make one continuous shot per generation, usually 5 to 20 seconds, and up to 30 seconds with Seedance 2.5. To turn a full script into a video, split it into shots the way a storyboard would: an establishing shot, a close-up, a reaction. Generate each one from its own prompt, keeping character descriptions identical across prompts, and join the clips in your editor.",
        "For consistency across shots, add a reference image of your character or product. Models such as Seedance 2.5, Wan 3.0 and MiniMax H3 use reference images to keep faces, outfits and objects the same from one clip to the next.",
      ],
    },
    {
      title: "How to write a text to video prompt",
      bullets: [
        "Subject: who or what, with a few specific details (“a red-haired cyclist in a yellow rain jacket”).",
        "Action: one clear movement (“rides through a puddle, water splashing”).",
        "Setting and time: “a narrow Amsterdam street at dusk, wet cobblestones”.",
        "Camera: “low-angle tracking shot”, “slow dolly-in”, “drone flyover”.",
        "Style and light: “cinematic, 35mm film grain, neon reflections”.",
        "Sound (on audio models): “rain, distant traffic, bicycle bell”.",
      ],
    },
    {
      title: "Which model suits your text",
      paragraphs: [
        "Start with LTX-2.5 Fast to test ideas quickly and cheaply, then re-run the winning prompt on a higher-end model. Seedance 2.5 follows complex, multi-part instructions well and holds long scenes together. Wan 3.0 can also read a document or a web page as context, which is handy for turning an article into an explainer shot. Gemini Omni Flash 1.1 renders up to 4K when you need maximum detail.",
        "Prefer to start from a picture? Use the [AI image to video](/image-to-video) generator. Need to change a clip afterwards? Open it in the [AI video editor](/ai-video-editor).",
      ],
    },
  ],
  useCases: {
    title: "What you can make from text",
    items: [
      { title: "Faceless YouTube and Shorts", body: "Visuals for narrated videos, one prompt per line of your script." },
      { title: "Explainers", body: "Show a concept, a process or a place without stock footage." },
      { title: "Ads and promos", body: "Quick concept ads; for product-led ads see the [AI UGC video generator](/ai-ugc-video-generator)." },
      { title: "Storyboards and pre-viz", body: "Preview scenes for a film or pitch before a shoot." },
    ],
  },
  faqs: [
    PRICING_FAQ,
    {
      q: "What is text to video AI?",
      a: "It's a model that generates a video from a written description. You describe the scene and the AI creates every frame, including motion, lighting and camera movement.",
    },
    {
      q: "Can I turn a whole script into a video?",
      a: "Yes, shot by shot. Each generation is one continuous clip, so split your script into scenes, generate each one, and edit them together. Keep character descriptions the same, or use a reference image, for consistency.",
    },
    {
      q: "Does the AI add sound?",
      a: "Several models, including Seedance 2.5, Wan 3.0, LTX-2.5 and FLUX 3 Video, can generate native audio (ambience and sound effects) in the same pass. Describe the sounds you want in the prompt.",
    },
    {
      q: "How long does generation take?",
      a: "Usually from under a minute to a few minutes, depending on the model, the length and the resolution. Fast models like LTX-2.5 Fast are the quickest.",
    },
  ],
  related: ["/", "/image-to-video", "/ai-video-editor", "/ai-video-extender"],
};

export const lyricVideo: ToolContent = {
  path: "/lyric-video-generator",
  title: "AI Lyric Video Generator – Free & Online",
  description:
    "Make a lyric video with AI: attach your song, describe the look and the words on screen, and generate visuals that move with the music. Free sign-up.",
  h1: "AI Lyric Video Generator",
  intro:
    "Our lyric video generator turns your song into visuals that move with the music. Attach your track, describe the look, and write the lyric line you want on screen. The AI generates an animated clip conditioned on your audio, in the right aspect ratio for YouTube, Spotify Canvas, TikTok or Reels.",
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
        body: "Add the audio by URL with the + button. LTX-2.3 Fast uses up to 30 seconds of audio to drive the video, so use a verse or a hook.",
      },
      {
        title: "Describe visuals and lyrics",
        body: "Set the scene and the typography: “Bold white text reading ‘we were golden’ fades in over slow-motion city lights, 80s synthwave style.”",
      },
      {
        title: "Generate section by section",
        body: "Generate one clip per lyric line or section, then line the clips up with your track in any editor.",
      },
    ],
  },
  sections: [
    {
      title: "Audio-driven visuals that feel like your song",
      paragraphs: [
        "A good lyric video matches the song's energy: slow, dreamy imagery for a ballad, fast cuts and bold colour for a drop. Because the video is generated with your audio as input, the motion follows the music instead of sitting on top of it. The audio is merged with the generated video and trimmed to the clip length, so each clip already plays with your track.",
      ],
    },
    {
      title: "Getting clean text on screen",
      paragraphs: [
        "Today's video models can render short on-screen text, but they're best with a few words at a time. Put the exact words in quotes in your prompt, keep each clip to one short line, and describe the typeface style (“bold sans-serif”, “handwritten neon”). For long verses, generate the background visuals here and add the full lyrics as captions in your editor. That's the approach many artists use for a clean, readable result.",
      ],
      bullets: [
        "Use quotes for the exact lyric: “the text ‘hold on’ appears in the sky”.",
        "Keep it to one line per clip, two to six words.",
        "Name a style: kinetic typography, handwritten, neon sign, film subtitle.",
        "Keep the background calm behind the text so the words stay readable.",
      ],
    },
    {
      title: "Lyric video maker styles to try",
      bullets: [
        "Kinetic typography: words that slide, bounce or scale to the beat over abstract motion.",
        "Aesthetic loops: vintage film, rain on glass or a night drive, looped behind the words.",
        "Anime and illustrated worlds that follow the story of the song.",
        "Visualizer style: particles, waves and light that pulse with the audio.",
      ],
    },
    {
      title: "Pair it with a full music video",
      paragraphs: [
        "Want scenes rather than words? The [AI music video generator](/ai-music-video-generator) uses the same audio-to-video approach for performance shots and story scenes. You can also animate your cover art with the [AI image to video](/image-to-video) tool and use it as the lyric video background.",
      ],
    },
  ],
  useCases: {
    title: "Who makes lyric videos here",
    items: [
      { title: "Independent artists", body: "A release-day lyric video for YouTube without hiring an animator." },
      { title: "Spotify Canvas and Shorts", body: "Short vertical loops with the hook line on screen." },
      { title: "Producers and labels", body: "Quick visuals to test which track or hook lands on social." },
      { title: "Cover and fan content", body: "Lyric clips for covers and remixes, in any style you describe." },
    ],
  },
  faqs: [
    PRICING_FAQ,
    {
      q: "How do I make a lyric video with AI?",
      a: "Attach your song by URL, describe the visuals and the lyric line to show (in quotes), pick an audio-capable model such as LTX-2.3 Fast, and generate. Repeat for each section of the song and join the clips.",
    },
    {
      q: "Can the AI write out all my lyrics accurately?",
      a: "Short lines render best. For full verses, generate the visuals here and add the lyrics as captions in your editor, which gives you exact timing and spelling.",
    },
    {
      q: "How much of my song can I use?",
      a: "Audio-conditioned clips use up to 30 seconds of audio at a time (LTX-2.3 Fast). Make longer lyric videos from several clips.",
    },
    {
      q: "Can I upload an MP3 file?",
      a: "Right now audio is attached by URL (for example, a link to the file in your cloud storage). Direct audio file upload isn't available yet.",
    },
  ],
  related: ["/ai-music-video-generator", "/image-to-video", "/text-to-video", "/"],
};

export const musicVideo: ToolContent = {
  path: "/ai-music-video-generator",
  title: "AI Music Video Generator from Audio (Free)",
  description:
    "Generate a music video from audio with AI. Attach your track, describe the scenes, and get visuals that follow the beat. Free sign-up, cost shown upfront.",
  h1: "AI Music Video Generator from Audio",
  intro:
    "This AI music video generator creates visuals from your audio. Attach a track, describe the world you want (a neon city, a desert road, an animated dreamscape) and the model generates video conditioned on your music, with the song already on the clip. Build a full music video scene by scene, without a crew or a budget.",
  preset: {
    modelId: LTX_23_FAST,
    placeholder: "Attach your track with + (audio URL), then describe the scene and the mood…",
  },
  howTo: {
    title: "How to make a music video from audio",
    steps: [
      {
        title: "Attach your audio",
        body: "Add your track by URL with the + button. Pick a section of up to 30 seconds: an intro, a verse, a chorus or a drop.",
      },
      {
        title: "Describe the scene",
        body: "Write the visuals and the energy: “Slow-motion dancer in a flooded warehouse, strobe light on the beat, blue and magenta haze.”",
      },
      {
        title: "Generate and assemble",
        body: "Generate a clip for each section, then line them up on your timeline. Extend any shot with the [AI video extender](/ai-video-extender).",
      },
    ],
  },
  sections: [
    {
      title: "Audio-to-video models",
      paragraphs: [
        "Unlike tools that cut stock footage to a beat, an audio-to-video model generates new frames with your track as an input. LTX-2.3 Fast takes a single audio file and merges it with the generated video. Wan 3.0, MiniMax H3 and Seedance 2.5 accept reference audio alongside images and video references, which is useful when you also want to keep an artist's look consistent across scenes.",
      ],
    },
    {
      title: "Ideas for AI music videos",
      bullets: [
        "Performance: the artist (from a reference photo) singing on a rooftop, a stage or a moving train.",
        "Narrative: a short story told across verse and chorus, one scene per section.",
        "Abstract: fluid shapes, particles and light that react to the rhythm.",
        "Animated: anime, claymation, watercolour or pixel-art worlds.",
        "Visualizer: a looping animation of your cover art, made with the [AI image to video](/image-to-video) tool.",
      ],
    },
    {
      title: "Getting a coherent full-length video",
      paragraphs: [
        "Plan the video like a director: write a one-line idea per song section, and reuse the same character, colour palette and style words in every prompt. Upload a reference image of the artist or a key character so faces stay consistent. Generate a couple of variations of each section and keep the strongest. For words on screen, use the [lyric video generator](/lyric-video-generator).",
      ],
    },
    {
      title: "Finding the best free AI music video generator",
      paragraphs: [
        "Free tools often add watermarks, cap resolution or limit you to one model. Here you can sign up free, try several leading models, and see the exact estimated cost of each clip before you generate, so you only spend on the shots you want. For a wider comparison, see our guide to the [best free AI video generators](/blog/best-free-ai-video-generators).",
      ],
    },
  ],
  useCases: {
    title: "Made for musicians and creators",
    items: [
      { title: "Release visuals", body: "A music video for YouTube on release day, without a production budget." },
      { title: "Short-form promo", body: "Vertical 9:16 clips of the hook for TikTok, Reels and Shorts." },
      { title: "Live show visuals", body: "Loops and backdrops for DJ sets and concerts." },
      { title: "Pitching a concept", body: "Show a director or a label your treatment as real moving images." },
    ],
  },
  faqs: [
    PRICING_FAQ,
    {
      q: "Can AI make a music video from my song?",
      a: "Yes. Attach your track, describe the visuals, and an audio-to-video model generates a clip with your music on it. Make one clip per section and edit them together for a full video.",
    },
    {
      q: "Which model should I use?",
      a: "Start with LTX-2.3 Fast, which takes an audio file directly and is fast and inexpensive. For scenes with consistent characters, try Wan 3.0, MiniMax H3 or Seedance 2.5 with reference audio and a reference image.",
    },
    {
      q: "How long can each clip be?",
      a: "Audio-driven clips use up to 30 seconds of audio at a time. Clip length depends on the model; LTX-2.3 Fast makes clips of up to 20 seconds.",
    },
    {
      q: "Do I own the music video?",
      a: "You keep the rights to your music. The generated visuals are yours to use under each model provider's terms, including on YouTube and streaming platforms.",
    },
  ],
  related: ["/lyric-video-generator", "/image-to-video", "/ai-video-extender", "/"],
};

export const videoExtender: ToolContent = {
  path: "/ai-video-extender",
  title: "AI Video Extender – Make Videos Longer Free",
  description:
    "Extend any video with AI. Add seconds to a clip past its last frame, keeping the same scene, style and motion. Try Seedance 2.5 and Gemini Omni Flash.",
  h1: "AI Video Extender: Make Any Clip Longer",
  intro:
    "Our AI video extender continues a clip past its last frame. Give it a video and a short description of what happens next, and the model generates new footage that matches the scene, lighting and motion, so a 5-second shot becomes 10, 20 or more. It works on AI-generated clips and on regular footage.",
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
        body: "Upload the clip (MP4, MOV, WebM and more) or paste a link as the input video. The extender is set up with Seedance 2.5 in Extend mode.",
      },
      {
        title: "Describe what happens next",
        body: "Continue the action: “The car keeps driving into the tunnel, headlights sweeping the walls.” Leave it blank to let the model continue naturally.",
      },
      {
        title: "Generate and repeat",
        body: "Generate the extension. To go longer, extend the new clip again, one step at a time.",
      },
    ],
  },
  sections: [
    {
      title: "Two ways to extend a video",
      bullets: [
        "Seedance 2.5 (Extend mode) continues the source clip beyond its original ending, keeping subjects and style consistent. It's the default here.",
        "Gemini Omni Flash 1.1 offers scene extension in 3 to 10 second steps, up to 30 seconds in total, with up to 4K output.",
      ],
      paragraphs: [
        "Switch models from the model picker; your prompt and input video carry over. If you'd rather change what's in the clip than add to it, switch Seedance to Edit mode or open the [AI video editor](/ai-video-editor).",
      ],
    },
    {
      title: "When to use an AI video lengthener",
      bullets: [
        "A generated clip ends too early and you need the rest of the movement.",
        "B-roll or stock footage is a few seconds shorter than the voice-over.",
        "You want a loop to hold longer before cutting away.",
        "A social edit needs a longer hold on the final shot for text or a call to action.",
        "You're turning a short AI shot into a longer scene for a story or a music video.",
      ],
    },
    {
      title: "Tips for seamless extensions",
      paragraphs: [
        "Describe a continuation, not a new scene. The strongest extensions keep the same camera direction and speed. Big changes, such as a new location or a sudden cut, are better generated as a separate shot with [text to video AI](/text-to-video). Extend in small steps and review each one: it's easier to steer the story a few seconds at a time than in one long jump.",
      ],
    },
  ],
  useCases: {
    title: "Who uses the extender",
    items: [
      { title: "Editors", body: "Fill a gap in the timeline without reshooting or slowing the footage down." },
      { title: "AI video creators", body: "Grow a strong 5-second generation into a full scene." },
      { title: "Musicians", body: "Stretch a shot to fit a section of the song, alongside the [AI music video generator](/ai-music-video-generator)." },
      { title: "Marketers", body: "Add breathing room at the end of an ad for a logo or an offer." },
    ],
  },
  faqs: [
    PRICING_FAQ,
    {
      q: "How do I make a video longer with AI?",
      a: "Attach your clip as the input video, describe what happens next, and generate. The AI adds new frames after the last one. Repeat on the result to keep going.",
    },
    {
      q: "How much longer can I make a video?",
      a: "Each extension adds a few seconds. Gemini Omni Flash 1.1 extends in 3 to 10 second steps up to 30 seconds in total; with Seedance 2.5 you can keep extending the newest clip.",
    },
    {
      q: "Can I extend a real (non-AI) video?",
      a: "Yes. Any clip you can link to works as the input video. Results are best with steady shots and clear motion.",
    },
    {
      q: "How do I add my video?",
      a: "Drop the file onto the prompt box or pick it with the + button. It uploads to your workspace, and supported formats are MP4, MOV, WebM, MKV, AVI, MPEG, OGG and 3GP. You can also paste a link to a video that's already online.",
    },
  ],
  related: ["/ai-video-editor", "/text-to-video", "/image-to-video", "/"],
};

export const videoEditor: ToolContent = {
  path: "/ai-video-editor",
  title: "Free AI Video Editor Online – Edit with AI",
  description:
    "Edit videos with AI by describing the change: swap backgrounds, restyle scenes, add text or objects. Free online AI video editor with Seedance, Wan and Gemini.",
  h1: "AI Video Editor: Edit Videos by Describing the Change",
  intro:
    "This AI video editor changes footage from a sentence. Attach a clip and say what to change (“make it snow”, “turn it into an anime scene”, “add a neon sign that reads OPEN”) and the model edits the video while keeping the rest of the shot intact. There's no timeline, masking or keyframing to learn. It runs online in your browser.",
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
        body: "Upload your clip or paste a link as the input video. The editor opens with Seedance 2.5 in Edit mode.",
      },
      {
        title: "Describe the edit",
        body: "Be specific about what changes and what stays: “Replace the grey sky with a golden sunset; keep the people and the car unchanged.”",
      },
      {
        title: "Generate and compare",
        body: "Generate the edit, compare it with the original in your gallery, and refine the wording if needed.",
      },
    ],
  },
  sections: [
    {
      title: "What you can do with an AI video editor",
      bullets: [
        "Change the setting: new backgrounds, weather, season or time of day.",
        "Restyle: turn footage into anime, claymation, watercolour or a film look.",
        "Add or remove objects: a product in someone's hand, a sign on a wall, or a distraction removed from the frame.",
        "Add text to a video: titles, signs and short captions, written into the scene itself.",
        "Change the look of a subject, such as an outfit, hair colour or materials, while the motion stays the same.",
        "Continue a clip: switch to Extend mode, or use the [AI video extender](/ai-video-extender).",
      ],
    },
    {
      title: "Models for editing video",
      paragraphs: [
        "Seedance 2.5 is built for precise edits that preserve the rest of the shot, and switches between Edit and Extend with one setting. Gemini Omni Flash 1.1 edits and extends source video with up to 4K output. Wan 3.0, MiniMax H3 and FLUX 3 Video take video as input for video-to-video restyling, where your footage guides the motion and the prompt sets the new look.",
      ],
    },
    {
      title: "How to add text to a video with AI",
      paragraphs: [
        "Describe the text and where it should live in the scene: “Add the words ‘Grand Opening’ in gold letters on the shop window.” AI-rendered text works best for short phrases of two to six words. For subtitles and long captions, a traditional caption tool is still the most accurate; use AI edits for text that should look like part of the world.",
      ],
    },
    {
      title: "Is this the best AI video editor for you?",
      paragraphs: [
        "If you need precise cuts, multi-track timelines and colour grading, keep your traditional editor and use this one for the parts that used to need VFX: replacing skies, restyling shots and adding objects. If you're starting from nothing, generate footage first with [text to video AI](/text-to-video) or the [AI image to video](/image-to-video) tool.",
      ],
    },
  ],
  useCases: {
    title: "Popular edits",
    items: [
      { title: "Social content", body: "Restyle one clip into several looks for A/B testing on Reels and TikTok." },
      { title: "Ads and product placement", body: "Put your product into existing footage; see the [AI UGC video generator](/ai-ugc-video-generator)." },
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
      a: "Yes. Upload it straight from your phone or computer (MP4 and MOV both work) as the input video. Short, steady clips give the cleanest results.",
    },
    {
      q: "Can I add text to a video?",
      a: "Yes. Describe the text in quotes and where it should appear. Short phrases render best; use a caption tool for long subtitles.",
    },
    {
      q: "Is there a length limit for editing?",
      a: "Input limits depend on the model. Most edits work on short clips, so split longer footage into shots and edit them one at a time.",
    },
  ],
  related: ["/ai-video-extender", "/text-to-video", "/image-to-video", "/ai-ugc-video-generator"],
};

export const ugcVideo: ToolContent = {
  path: "/ai-ugc-video-generator",
  title: "AI UGC Video & Ad Generator for Brands",
  description:
    "Create UGC-style video ads with AI. Turn product photos into scroll-stopping 9:16 clips for TikTok, Reels and Shorts, with no creators or shoots needed.",
  h1: "AI UGC Video Generator for Ads",
  intro:
    "Our AI UGC video generator turns a product photo and a short brief into authentic-looking, creator-style video ads: unboxings, try-ons, reactions and demos, in vertical 9:16 ready for TikTok, Instagram Reels and YouTube Shorts. Test many ad concepts in an afternoon, without booking creators or shipping product.",
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
        body: "Add a clean product photo as a reference image so the product stays accurate in every shot.",
      },
      {
        title: "Write the brief",
        body: "Describe the creator, the setting and the moment: “Handheld phone video, a young man in a gym tastes the drink and nods, natural light.”",
      },
      {
        title: "Generate variations",
        body: "Choose 9:16, generate several hooks and settings, and send the winners to your ad account for testing.",
      },
    ],
  },
  sections: [
    {
      title: "Why AI for UGC video ads",
      paragraphs: [
        "User-generated content works because it looks real and native to the feed, but hiring creators for every test is slow and expensive. An AI video ad generator lets you explore dozens of hooks, settings and audiences first, then invest in the concepts that win. Seedance 2.5 is especially suited to advertising, with strong instruction following, product consistency from reference images and native clips up to 30 seconds.",
      ],
    },
    {
      title: "UGC ad formats you can generate",
      bullets: [
        "Unboxing: hands open the package and reveal the product.",
        "Try-on or demo: the product in use at home, the gym, the office or outdoors.",
        "Reaction hook: a surprised or delighted first reaction in the first two seconds.",
        "Before and after: use a first and a last frame to show a transformation.",
        "Product-in-scene: your product placed into lifestyle footage with the [AI video editor](/ai-video-editor).",
        "Hero spin: a rotating product shot made with the [AI image to video](/image-to-video) tool.",
      ],
    },
    {
      title: "Prompts that look like real UGC",
      bullets: [
        "Say “handheld phone video”, “selfie angle” or “filmed on an iPhone” for the native, unpolished look.",
        "Use natural light and everyday places: kitchens, bathrooms, cars, gyms.",
        "Hook in the first second: start the prompt with the most interesting moment.",
        "Turn on native audio and describe the ambient sound for extra realism.",
        "Keep your product's reference photo the same across every variation.",
      ],
    },
    {
      title: "Use it responsibly",
      paragraphs: [
        "Generate fictional people, never real creators or celebrities, and don't make claims about your product that the video can't back up. Many ad platforms ask you to label AI-generated content, so check each network's policy before you publish.",
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
      a: "It's a tool that creates videos in the style of user-generated content (handheld, casual, creator-led) from a text brief and your product images, for use in social ads.",
    },
    {
      q: "Will my product look accurate?",
      a: "Add a clear product photo as a reference image. Seedance 2.5, Wan 3.0 and MiniMax H3 use reference images to keep products consistent. Check small details such as logos and label text before you publish.",
    },
    {
      q: "What size are the videos?",
      a: "Choose 9:16 for TikTok, Reels and Shorts, 1:1 or 4:3 for feeds, or 16:9 for YouTube. Available sizes depend on the model.",
    },
    {
      q: "Can the person in the video speak?",
      a: "Models with native audio can generate ambient sound and short spoken lines described in your prompt. For a precise script, add a voice-over in your editor.",
    },
  ],
  related: ["/image-to-video", "/ai-video-editor", "/text-to-video", "/"],
};
