import { TextEncoder } from "node:util";
import type { ExportArtifact, WorkspaceExportStrategy } from "../types";
import type { ErdWorkspaceRecord } from "../../types/normalizedSchema";
import { renderSimplePdf } from "./schemaTextRenderer";

export class PdfDiagramExporter implements WorkspaceExportStrategy {
  readonly format = "pdf" as const;

  async export(workspace: ErdWorkspaceRecord): Promise<ExportArtifact> {
    const lines = [
      `SchemaPaste Workspace: ${workspace.name}`,
      `Source Type: ${workspace.sourceType}`,
      "",
      ...workspace.normalizedSchema.tables.flatMap((table) => [
        `Table ${table.name}`,
        ...table.columns.map((column) => `  - ${column.name}: ${column.dataType}`),
        ""
      ])
    ];

    const content = renderSimplePdf(lines);
    return {
      fileName: `${workspace.name.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      content
    };
  }
}
