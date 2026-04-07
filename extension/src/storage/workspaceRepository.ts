import * as vscode from "vscode";
import {
  DEFAULT_EXPORT_PREFERENCES,
  DEFAULT_LINE_CUSTOMIZATION,
  type ErdWorkspaceRecord,
  type NormalizedSchemaModel,
  type SchemaSourceType
} from "../types/normalizedSchema";

const WORKSPACES_KEY = "schemapaste.workspaces.v2";

export interface CreateWorkspaceInput {
  id?: string;
  name: string;
  sourceType: SchemaSourceType;
  originalSourceContent: string;
  normalizedSchema: NormalizedSchemaModel;
}

export type WorkspaceSort = "updatedDesc" | "updatedAsc" | "nameAsc" | "nameDesc";

export class WorkspaceRepository {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async list(search = "", sort: WorkspaceSort = "updatedDesc"): Promise<ErdWorkspaceRecord[]> {
    const items = this.readAll();
    const query = search.trim().toLowerCase();
    const filtered = query
      ? items.filter((item) =>
          [item.name, item.sourceType, item.originalSourceContent].join("\n").toLowerCase().includes(query)
        )
      : items;

    const sorted = filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      if (sort === "updatedAsc") {
        return a.updatedAt.localeCompare(b.updatedAt);
      }

      if (sort === "nameAsc") {
        return a.name.localeCompare(b.name);
      }

      if (sort === "nameDesc") {
        return b.name.localeCompare(a.name);
      }

      return b.updatedAt.localeCompare(a.updatedAt);
    });

    return sorted;
  }

  getById(id: string): ErdWorkspaceRecord | undefined {
    return this.readAll().find((item) => item.id === id);
  }

  async upsert(workspace: ErdWorkspaceRecord): Promise<ErdWorkspaceRecord> {
    const records = this.readAll();
    const index = records.findIndex((item) => item.id === workspace.id);
    if (index >= 0) {
      records[index] = {
        ...records[index],
        ...workspace,
        updatedAt: new Date().toISOString()
      };
    } else {
      records.push(workspace);
    }

    await this.writeAll(records);
    return workspace;
  }

  async create(input: CreateWorkspaceInput): Promise<ErdWorkspaceRecord> {
    const now = new Date().toISOString();
    const id = input.id ?? this.generateId();
    const created: ErdWorkspaceRecord = {
      id,
      name: input.name,
      sourceType: input.sourceType,
      originalSourceContent: input.originalSourceContent,
      normalizedSchema: input.normalizedSchema,
      erdNodePositions: {},
      relationshipMetadata: {},
      lineCustomization: DEFAULT_LINE_CUSTOMIZATION,
      exportPreferences: DEFAULT_EXPORT_PREFERENCES,
      pinned: false,
      createdAt: now,
      updatedAt: now
    };

    await this.upsert(created);
    return created;
  }

  async rename(id: string, nextName: string): Promise<void> {
    const item = this.getById(id);
    if (!item) {
      return;
    }
    item.name = nextName;
    item.updatedAt = new Date().toISOString();
    await this.upsert(item);
  }

  async delete(id: string): Promise<void> {
    const next = this.readAll().filter((item) => item.id !== id);
    await this.writeAll(next);
  }

  async duplicate(id: string): Promise<ErdWorkspaceRecord | undefined> {
    const existing = this.getById(id);
    if (!existing) {
      return undefined;
    }

    const now = new Date().toISOString();
    const copy: ErdWorkspaceRecord = {
      ...existing,
      id: this.generateId(),
      name: `${existing.name} Copy`,
      createdAt: now,
      updatedAt: now,
      pinned: false
    };

    await this.upsert(copy);
    return copy;
  }

  async setPinned(id: string, pinned: boolean): Promise<void> {
    const existing = this.getById(id);
    if (!existing) {
      return;
    }

    existing.pinned = pinned;
    existing.updatedAt = new Date().toISOString();
    await this.upsert(existing);
  }

  private readAll(): ErdWorkspaceRecord[] {
    return this.context.workspaceState.get<ErdWorkspaceRecord[]>(WORKSPACES_KEY, []);
  }

  private async writeAll(items: ErdWorkspaceRecord[]): Promise<void> {
    await this.context.workspaceState.update(WORKSPACES_KEY, items);
  }

  private generateId(): string {
    return `ws_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
