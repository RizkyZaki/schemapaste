import type { NormalizedSchemaModel, SchemaSourceType } from "../types/normalizedSchema";
import { WorkspaceRepository } from "../storage/workspaceRepository";

export class WorkspaceManager {
  constructor(private readonly repository: WorkspaceRepository) {}

  async createWorkspace(name: string, sourceType: SchemaSourceType, schema: NormalizedSchemaModel, source: string) {
    return this.repository.create({
      name,
      sourceType,
      normalizedSchema: schema,
      originalSourceContent: source
    });
  }

  async saveWorkspaceSource(id: string, source: string): Promise<void> {
    const existing = this.repository.getById(id);
    if (!existing) {
      return;
    }

    existing.originalSourceContent = source;
    existing.updatedAt = new Date().toISOString();
    await this.repository.upsert(existing);
  }
}
