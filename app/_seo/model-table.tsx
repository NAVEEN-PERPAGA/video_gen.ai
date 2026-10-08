import { modelPages, modelPageHref } from "@/app/_seo/model-pages";
import { modelSpecs, usd } from "@/app/_seo/models";
import { Table } from "@/app/_seo/sections";

/** Every video model side by side, each name linking to its model page. Built from data/video/models. */
export function ModelTable() {
  return (
    <Table
      caption="AI video models compared"
      head={["Model", "Made by", "Max length", "Max resolution", "Starts from", "Sound", "Inputs"]}
      rows={modelSpecs.map((m) => {
        const href = modelPageHref(m.id);
        const audio = modelPages.find((p) => p.id === m.id)?.audio;
        return [
          href ? `[${m.name}](${href})` : m.name,
          m.maker,
          m.maxSeconds ? `${m.maxSeconds}s` : "–",
          m.maxResolution ?? "–",
          m.fromPerSecond ? `${usd(m.fromPerSecond)}/s` : "–",
          audio === undefined ? "–" : audio ? "Yes" : "No",
          m.inputs.join(", "),
        ];
      })}
    />
  );
}
