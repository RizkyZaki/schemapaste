import * as vscode from "vscode";
import { registerWorkspaceCommands } from "./commands/workspaceCommands";
import { WorkspaceCustomEditorProvider } from "./custom-editor/workspaceEditorProvider";
import { createDefaultExportService } from "./exporters/createDefaultExportService";
import { WorkspaceHistoryTreeProvider, SCHEMAPASTE_HISTORY_VIEW_ID } from "./sidebar/workspaceTreeProvider";
import { WorkspaceRepository } from "./storage/workspaceRepository";

export function activate(context: vscode.ExtensionContext): void {
  const repository = new WorkspaceRepository(context);
  const exportService = createDefaultExportService();
  const historyProvider = new WorkspaceHistoryTreeProvider(repository);

  context.subscriptions.push(
    vscode.window.createTreeView(SCHEMAPASTE_HISTORY_VIEW_ID, {
      treeDataProvider: historyProvider,
      showCollapseAll: false
    })
  );

  context.subscriptions.push(WorkspaceCustomEditorProvider.register(context, repository));

  registerWorkspaceCommands(context, repository, historyProvider, exportService);

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.openErd", async () => {
      await vscode.commands.executeCommand("schemapaste.newWorkspace");
    })
  );
}

export function deactivate(): void {
  // no-op
}
