/**
 * Shared by scripts/generate-runware-*-models.mjs: turns Runware's OpenAPI
 * files into the compact per-model request schemas the app uses.
 *
 * Field definitions come straight from the OpenAPI schema. The cross-field
 * rules (`allOf` in the source) are copied verbatim into `conditions` for
 * machine validation, and described by hand in each script's RULES, one
 * sentence per condition — `generate` fails when the counts differ.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Shared rule sentences for the conditions most models have.
export const PAIR = "Width and height must be sent together.";
export const PRESET = "Width × height must be one of the supported sizes.";
export const RES_XOR = "Choose either a resolution preset or an exact size, not both.";

// Keys copied as-is from a property definition, in output order.
const PASSTHROUGH = [
  "type", "const", "enum", "default", "minimum", "maximum", "exclusiveMinimum",
  "exclusiveMaximum", "multipleOf", "minLength", "maxLength", "minItems", "maxItems",
];
// Keys dropped on purpose (documentation or covered by `rules`/`conditions`).
const DROPPED = new Set([
  "title", "$id", "additionalProperties", "contains", "dependentSchemas", "pattern", "examples",
  "x-order", "dependentRequired",
]);
const unknownKeys = new Set();

/** First paragraph of a description, without the trailing docs link. */
function shortDescription(text) {
  if (!text) return undefined;
  return text
    .split(/\n\s*\n/)[0]
    .replace(/\s*\[Read full documentation\]\([^)]*\)/, "")
    .trim();
}

/**
 * Field-level constraints that don't survive simplification, turned into
 * sentences. Throws on an unknown shape so a new rule is never dropped silently.
 */
function constraintNotes(node) {
  const notes = [];
  const lastOnly = node.contains?.not?.properties?.frame?.enum;
  if (lastOnly) {
    if (String(lastOnly) !== "last,-1") throw new Error(`Unknown contains: ${JSON.stringify(node.contains)}`);
    notes.push("Must include at least one image that is not the last frame.");
  }
  if (node.dependentSchemas) {
    const forbidden = node.dependentSchemas.frame?.not?.required;
    if (Object.keys(node.dependentSchemas).length !== 1 || String(forbidden) !== "timestamp") {
      throw new Error(`Unknown dependentSchemas: ${JSON.stringify(node.dependentSchemas)}`);
    }
    notes.push("Use either frame or timestamp, not both.");
  }
  if (node.dependentRequired) {
    // FLUX 3 bounding boxes: a sourceBox points into a reference image.
    for (const [key, needs] of Object.entries(node.dependentRequired)) {
      notes.push(`Setting ${key} also requires ${needs.join(", ")}.`);
    }
  }
  if (node.allOf) {
    // FLUX accelerator options: step vs percentage pairs, and one cache type at a time.
    const pairs = node.allOf.slice(0, 2).map((r) => String(r.not?.required));
    const caches = node.allOf[2]?.not?.anyOf?.every((b) => b.required?.every((k) => k.endsWith("Cache")));
    if (node.allOf.length !== 3 || String(pairs) !== "cacheStartStep,cacheStartStepPercentage,cacheEndStep,cacheEndStepPercentage" || !caches) {
      throw new Error(`Unknown allOf: ${JSON.stringify(node.allOf)}`);
    }
    notes.push("Set each cache start/end as a step or a percentage, not both, and enable only one cache type.");
  }
  return notes;
}

const isConstBranch = (b) => b && "const" in b;
const isEnumish = (b) => b && ("const" in b || "enum" in b) && !b.properties;

function simplify(node) {
  if (typeof node !== "object" || node === null) return node;
  const out = {};

  for (const key of PASSTHROUGH) if (key in node) out[key] = node[key];

  // A plain string/uri/uuid field: the format alternatives (uuid | uri |
  // data URI | base64) are explained by the description instead.
  if (node.format && !node.anyOf) out.format = node.format;

  if (node.oneOf) {
    if (node.oneOf.every(isConstBranch)) {
      // Choice list with per-option help, e.g. camera movements.
      out.oneOf = node.oneOf.map((b) => ({
        const: b.const,
        ...(b.description && { description: b.description }),
      }));
    } else if (node.oneOf.every(isEnumish)) {
      // e.g. duration: integer enum | "auto" -> one flat enum.
      out.enum = node.oneOf.flatMap((b) => ("enum" in b ? b.enum : [b.const]));
    } else {
      out.oneOf = node.oneOf.map(simplify);
    }
  }

  if (node.anyOf) {
    const formatOnly = node.anyOf.every((b) => Object.keys(b).every((k) => k === "format" || k === "pattern"));
    if (!formatOnly) out.anyOf = node.anyOf.map(simplify);
  }

  const notes = [shortDescription(node.description), ...constraintNotes(node)].filter(Boolean);
  if (notes.length) out.description = notes.join(" ");

  if (node.items) out.items = simplify(node.items);
  if (node.properties) {
    out.properties = Object.fromEntries(
      Object.entries(node.properties).map(([k, v]) => [k, simplify(v)]),
    );
  }
  if (node.required) out.required = node.required;

  for (const key of Object.keys(node)) {
    if (
      !PASSTHROUGH.includes(key) &&
      !DROPPED.has(key) &&
      !["format", "oneOf", "anyOf", "allOf", "description", "items", "properties", "required"].includes(key)
    ) {
      unknownKeys.add(key);
    }
  }
  return out;
}

/** Strips titles/ids from the raw `allOf` so it stays readable but exact. */
function stripDocs(node) {
  if (Array.isArray(node)) return node.map(stripDocs);
  if (typeof node !== "object" || node === null) return node;
  return Object.fromEntries(
    Object.entries(node)
      .filter(([k]) => k !== "$id" && !(k === "title" && typeof node[k] === "string"))
      .map(([k, v]) => [k, stripDocs(v)]),
  );
}

function aspect(w, h) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const g = gcd(w, h);
  const [a, b] = [w / g, h / g];
  // Near-standard ratios (e.g. 1920x1088) read better rounded.
  const known = [[16, 9], [9, 16], [4, 3], [3, 4], [1, 1], [21, 9], [9, 21], [3, 2], [2, 3]];
  const close = known.find(([x, y]) => Math.abs(w / h - x / y) < 0.03);
  return close ? `${close[0]}:${close[1]}` : a <= 32 && b <= 32 ? `${a}:${b}` : (w / h).toFixed(2);
}

/**
 * Width/height presets from the `if width|height then oneOf [...]` rule. Some
 * models have narrower preset rules for one mode (e.g. LTX audio-driven is
 * 1080p only), so take the largest list.
 */
function extractResolutions(allOf = []) {
  const presetLists = allOf
    .map((rule) => rule.then?.oneOf)
    .filter((branches) => branches?.every((b) => b.properties?.width?.const && b.properties?.height?.const))
    .sort((a, b) => b.length - a.length);
  if (presetLists.length === 0) return undefined;
  return presetLists[0].map((b) => {
    const width = b.properties.width.const;
    const height = b.properties.height.const;
    return { label: b.title ?? `${width}×${height} (${aspect(width, height)})`, width, height };
  });
}


/**
 * Converts every OpenAPI file in `src` (except `skip`) into `out/<id>.json`.
 * `type` is "video" or "image"; `fieldOrder` lists the fields to put first.
 */
export function generate({ src, out, type, skip = new Set(), pricing, checked, rules: allRules, fieldOrder }) {
  function convert(file) {
    const doc = JSON.parse(readFileSync(join(src, file), "utf8"));
    const info = doc.info;
    const body = doc.components.schemas.RequestBody;
    const task = body.items ?? body;
    const id = info["x-model-id"];

    const props = Object.entries(task.properties);
    props.sort(([a], [b]) => {
      const ia = fieldOrder.indexOf(a);
      const ib = fieldOrder.indexOf(b);
      return (ia === -1 ? fieldOrder.length : ia) - (ib === -1 ? fieldOrder.length : ib);
    });

    const conditions = stripDocs(task.allOf ?? []);
    if (!pricing[id]) console.warn(`! ${id}: no pricing`);
    const rules = allRules[id];
    if (rules?.length !== conditions.length) {
      throw new Error(
        `${id}: ${conditions.length} conditions but ${rules?.length ?? 0} rules. Update RULES to match allOf.`,
      );
    }

    const model = {
      name: info.title.replace(/^Runware API - /, ""),
      organisation: info["x-creator"]?.name,
      provider: "runware",
      value: info["x-air-id"],
      air_id: info["x-air-id"],
      href: `/models/${type}/${info["x-creator"]?.id}/${id}`,
      paid: true,
      type,
      capabilities: info["x-capabilities"].filter((c) => c !== "checkpoint"),
      description: info.description,
      schema: `https://runware.ai/docs/models/${id}`,
      ...(extractResolutions(task.allOf) && { resolutions: extractResolutions(task.allOf) }),
      ...(pricing[id] && {
        pricing: { ...pricing[id], source: `https://runware.ai/docs/models/${id}`, checked },
      }),
      required: task.required ?? [],
      rules,
      conditions,
      input: Object.fromEntries(props.map(([k, v]) => [k, simplify(v)])),
    };

    writeFileSync(join(out, `${id}.json`), `${JSON.stringify(model, null, 2)}\n`);
    return { id, conditions: conditions.length };
  }

  const results = readdirSync(src)
    .filter((f) => f.endsWith(".json") && !skip.has(f))
    .map(convert);

  for (const r of results) console.log(`${r.id}: ${r.conditions} conditions`);
  if (unknownKeys.size) console.warn(`! dropped unrecognised keys: ${[...unknownKeys].join(", ")}`);
}
