import { TextEncoder } from "node:util";
import type { ExportArtifact, WorkspaceExportStrategy } from "../types";
import type { ErdWorkspaceRecord } from "../../types/normalizedSchema";

function renderTableMarkdown(workspace: ErdWorkspaceRecord): string {
  return workspace.normalizedSchema.tables
    .map((table) => {
      const rows = table.columns
        .map((column) => {
          const flags = [column.isPrimaryKey ? "PK" : "", column.isUnique ? "UQ" : "", column.nullable ? "NULL" : "NN"]
            .filter(Boolean)
            .join(", ");
          return `| ${column.name} | ${column.dataType} | ${flags || "-"} |`;
        })
        .join("\n");

      return `## ${table.name}\n\n| Column | Type | Flags |\n|---|---|---|\n${rows}\n`;
    })
    .join("\n");
}

export class MarkdownDocExporter implements WorkspaceExportStrategy {
  readonly format = "markdown" as const;

  async export(workspace: ErdWorkspaceRecord): Promise<ExportArtifact> {
    const markdown = `# ${workspace.name}\n\nSource Type: ${workspace.sourceType}\n\n${renderTableMarkdown(workspace)}\n`;
    return {
      fileName: `${workspace.name.replace(/\s+/g, "-").toLowerCase()}.md`,
      content: new TextEncoder().encode(markdown)
    };
  }
}
