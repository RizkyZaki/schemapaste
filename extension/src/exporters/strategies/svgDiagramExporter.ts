import { TextEncoder } from "node:util";
import type { ExportArtifact, WorkspaceExportStrategy } from "../types";
import type { ErdWorkspaceRecord } from "../../types/normalizedSchema";
import { renderSchemaSvg } from "./schemaTextRenderer";

export class SvgDiagramExporter implements WorkspaceExportStrategy {
  readonly format = "svg" as const;

  async export(workspace: ErdWorkspaceRecord): Promise<ExportArtifact> {
    const svg = renderSchemaSvg(workspace);
    return {
      fileName: `${workspace.name.replace(/\s+/g, "-").toLowerCase()}.svg`,
      content: new TextEncoder().encode(svg)
    };
  }
}
