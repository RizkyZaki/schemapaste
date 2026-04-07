import type { ErdWorkspaceRecord } from "../types/normalizedSchema";

export type WorkspaceExportFormat =
  | "png"
  | "svg"
  | "json"
  | "normalized-json"
  | "source"
  | "markdown"
  | "pdf"
  | "sql"
  | "laravel"
  | "prisma"
  | "drizzle"
  | "typeorm"
  | "sequelize"
  | "django";

export interface ExportArtifact {
  fileName: string;
  content: Uint8Array;
}

export interface WorkspaceExportStrategy {
  readonly format: WorkspaceExportFormat;
  export(workspace: ErdWorkspaceRecord): Promise<ExportArtifact>;
}
