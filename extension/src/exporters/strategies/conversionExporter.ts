import { TextEncoder } from "node:util";
import type { ExportArtifact, WorkspaceExportFormat, WorkspaceExportStrategy } from "../types";
import type { ErdWorkspaceRecord } from "../../types/normalizedSchema";
import { renderSourceByFormat } from "./schemaTextRenderer";

const extensions: Record<string, string> = {
  sql: "sql",
  laravel: "php",
  prisma: "prisma",
  drizzle: "ts",
  typeorm: "ts",
  sequelize: "ts",
  django: "py"
};

export class ConversionExporter implements WorkspaceExportStrategy {
  constructor(public readonly format: WorkspaceExportFormat) {}

  async export(workspace: ErdWorkspaceRecord): Promise<ExportArtifact> {
    const text = renderSourceByFormat(workspace, this.format);
    const ext = extensions[this.format] ?? "txt";

    return {
      fileName: `${workspace.name.replace(/\s+/g, "-").toLowerCase()}.${ext}`,
      content: new TextEncoder().encode(text)
    };
  }
}
