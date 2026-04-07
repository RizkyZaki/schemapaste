import * as vscode from "vscode";
import type { ErdWorkspaceRecord } from "../types/normalizedSchema";
import { WorkspaceRepository, type WorkspaceSort } from "../storage/workspaceRepository";

export const SCHEMAPASTE_HISTORY_VIEW_ID = "schemapaste.workspaceHistory";

export class WorkspaceTreeItem extends vscode.TreeItem {
  constructor(public readonly workspace: ErdWorkspaceRecord) {
    super(workspace.name, vscode.TreeItemCollapsibleState.None);
    this.id = workspace.id;
    this.contextValue = workspace.pinned ? "workspaceItemPinned" : "workspaceItem";
    this.description = `${workspace.sourceType} • ${new Date(workspace.updatedAt).toLocaleString()}`;
    this.tooltip = `${workspace.name}\n${workspace.sourceType}\nUpdated: ${workspace.updatedAt}`;
    this.iconPath = workspace.pinned ? new vscode.ThemeIcon("pin") : new vscode.ThemeIcon("database");
    this.command = {
      command: "schemapaste.openWorkspace",
      title: "Open Workspace",
      arguments: [workspace.id]
    };
  }
}

export class WorkspaceHistoryTreeProvider implements vscode.TreeDataProvider<WorkspaceTreeItem> {
  private readonly onDidChangeEmitter = new vscode.EventEmitter<WorkspaceTreeItem | void>();
  readonly onDidChangeTreeData = this.onDidChangeEmitter.event;

  private search = "";
  private sort: WorkspaceSort = "updatedDesc";

  constructor(private readonly repository: WorkspaceRepository) {}

  refresh(): void {
    this.onDidChangeEmitter.fire();
  }

  setSearch(query: string): void {
    this.search = query;
    this.refresh();
  }

  async toggleSort(): Promise<void> {
    this.sort = this.sort === "updatedDesc" ? "nameAsc" : this.sort === "nameAsc" ? "nameDesc" : "updatedDesc";
    this.refresh();
  }

  getTreeItem(element: WorkspaceTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<WorkspaceTreeItem[]> {
    const workspaces = await this.repository.list(this.search, this.sort);
    return workspaces.map((workspace) => new WorkspaceTreeItem(workspace));
  }
}
