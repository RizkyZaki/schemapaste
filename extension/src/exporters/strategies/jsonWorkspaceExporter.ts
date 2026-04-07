import { TextEncoder } from "node:util";
import type { ExportArtifact, WorkspaceExportStrategy } from "../types";
import type { ErdWorkspaceRecord } from "../../types/normalizedSchema";

export class JsonWorkspaceExporter implements WorkspaceExportStrategy {
  readonly format = "json" as const;

  async export(workspace: ErdWorkspaceRecord): Promise<ExportArtifact> {
    const json = JSON.stringify(workspace, null, 2);
    return {
      fileName: `${workspace.name.replace(/\s+/g, "-").toLowerCase()}.schemapaste.json`,
      content: new TextEncoder().encode(json)
    };
  }
}
