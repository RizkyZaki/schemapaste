import { TextEncoder } from "node:util";
import type { ExportArtifact, WorkspaceExportStrategy } from "../types";
import type { ErdWorkspaceRecord } from "../../types/normalizedSchema";

const extensionBySourceType: Record<string, string> = {
  sql: "sql",
  laravel: "php",
  prisma: "prisma",
  drizzle: "ts",
  typeorm: "ts",
  sequelize: "ts",
  django: "py"
};

export class SourceContentExporter implements WorkspaceExportStrategy {
  readonly format = "source" as const;

  async export(workspace: ErdWorkspaceRecord): Promise<ExportArtifact> {
    const ext = extensionBySourceType[workspace.sourceType] ?? "txt";
    return {
      fileName: `${workspace.name.replace(/\s+/g, "-").toLowerCase()}.${ext}`,
      content: new TextEncoder().encode(workspace.originalSourceContent)
    };
  }
}
