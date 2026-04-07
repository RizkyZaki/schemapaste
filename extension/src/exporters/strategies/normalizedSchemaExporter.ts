import { TextEncoder } from "node:util";
import type { ExportArtifact, WorkspaceExportStrategy } from "../types";
import type { ErdWorkspaceRecord } from "../../types/normalizedSchema";

export class NormalizedSchemaExporter implements WorkspaceExportStrategy {
  readonly format = "normalized-json" as const;

  async export(workspace: ErdWorkspaceRecord): Promise<ExportArtifact> {
    return {
      fileName: `${workspace.name.replace(/\s+/g, "-").toLowerCase()}.normalized.json`,
      content: new TextEncoder().encode(JSON.stringify(workspace.normalizedSchema, null, 2))
    };
  }
}
