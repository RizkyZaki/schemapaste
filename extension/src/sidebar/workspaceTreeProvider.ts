import * as vscode from "vscode";
import type { ErdWorkspaceRecord } from "../types/normalizedSchema";
import { WorkspaceRepository, type WorkspaceSort } from "../storage/workspaceRepository";

export const SCHEMAPASTE_HISTORY_VIEW_ID = "schemapaste.workspaceHistory";

export class WorkspaceTreeItem extends vscode.TreeItem {
  constructor(public readonly workspace: ErdWorkspaceRecord) {
    super(workspace.name, vscode.TreeItemCollapsibleState.None);
    this.id = workspace.id;
    this.contextValue = workspace.pinned ? "workspaceItemPinned" : "workspaceItem";
    this.description = `${workspace.sourceType.toUpperCase()} • ${workspace.pinned ? "PIN" : "HISTORY"}`;
    this.tooltip = `${workspace.name}\n${workspace.sourceType}\nUpdated: ${workspace.updatedAt}`;
    this.iconPath = workspace.pinned ? new vscode.ThemeIcon("pin") : sourceIcon(workspace.sourceType);
    this.command = {
      command: "schemapaste.openWorkspace",
      title: "Open Workspace",
      arguments: [workspace.id]
    };
  }
}

class EmptyStateTreeItem extends vscode.TreeItem {
  constructor(label: string, description: string, command: vscode.Command, icon: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.command = command;
    this.contextValue = "workspaceEmptyState";
    this.iconPath = new vscode.ThemeIcon(icon);
  }
}

function sourceIcon(sourceType: ErdWorkspaceRecord["sourceType"]): vscode.ThemeIcon {
  switch (sourceType) {
    case "sql":
      return new vscode.ThemeIcon("database");
    case "laravel":
      return new vscode.ThemeIcon("symbol-method");
    case "prisma":
      return new vscode.ThemeIcon("symbol-namespace");
    case "drizzle":
      return new vscode.ThemeIcon("symbol-struct");
    case "typeorm":
      return new vscode.ThemeIcon("symbol-class");
    case "sequelize":
      return new vscode.ThemeIcon("symbol-interface");
    case "django":
      return new vscode.ThemeIcon("symbol-field");
    default:
      return new vscode.ThemeIcon("database");
  }
}

export class WorkspaceHistoryTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.TreeItem | void>();
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

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    const workspaces = await this.repository.list(this.search, this.sort);
    if (workspaces.length === 0) {
      return [
        new EmptyStateTreeItem(
          "Create ERD Workspace",
          "Start from SQL or framework source",
          {
            command: "schemapaste.newWorkspace",
            title: "New Workspace"
          },
          "add"
        ),
        new EmptyStateTreeItem(
          "Open Workspace Picker",
          "Browse existing history",
          {
            command: "schemapaste.openWorkspace",
            title: "Open Workspace"
          },
          "folder-opened"
        ),
        new EmptyStateTreeItem(
          "Search History",
          "Filter by name or source",
          {
            command: "schemapaste.searchWorkspace",
            title: "Search Workspace"
          },
          "search"
        )
      ];
    }

    return workspaces.map((workspace) => new WorkspaceTreeItem(workspace));
  }
}
