"use client";

import type { Beat } from "@/content/schema";
import { SketchToUi } from "./SketchToUi";
import { ArchitectureDiagram } from "./ArchitectureDiagram";
import { CommitLog, TerminalTests } from "./Terminals";
import { PipelineStrip } from "./PipelineStrip";
import { SdlcLoop } from "./SdlcLoop";

/**
 * Visual beat dispatcher — exhaustive with a `never` check so a new visual
 * kind without a renderer fails compilation [CNT-02].
 */
export function VisualBeatView({ beat }: { beat: Extract<Beat, { kind: "visual" }> }) {
  switch (beat.visual) {
    case "sketchToUi":
      return <SketchToUi beat={beat} />;
    case "architecture":
      return <ArchitectureDiagram beat={beat} />;
    case "commitLog":
      return <CommitLog beat={beat} />;
    case "terminalTests":
      return <TerminalTests beat={beat} />;
    case "pipeline":
      return <PipelineStrip beat={beat} />;
    case "sdlcLoop":
      return <SdlcLoop beat={beat} />;
    default: {
      const never: never = beat.visual;
      return never;
    }
  }
}
