import * as vscode from "vscode";
import type { ErdWorkspaceRecord } from "../types/normalizedSchema";
import type { WorkspaceExportFormat, WorkspaceExportStrategy } from "./types";

export class WorkspaceExportService {
  private readonly strategies = new Map<WorkspaceExportFormat, WorkspaceExportStrategy>();

  register(strategy: WorkspaceExportStrategy): void {
    this.strategies.set(strategy.format, strategy);
  }

  async exportToFile(workspace: ErdWorkspaceRecord, format: WorkspaceExportFormat): Promise<void> {
    const strategy = this.strategies.get(format);
    if (!strategy) {
      throw new Error(`No exporter strategy found for format: ${format}`);
    }

    const artifact = await strategy.export(workspace);
    const defaultFolder = vscode.workspace.workspaceFolders?.[0]?.uri;
    const targetUri = await vscode.window.showSaveDialog({
      defaultUri: defaultFolder ? vscode.Uri.joinPath(defaultFolder, artifact.fileName) : undefined,
      saveLabel: `Export ${format.toUpperCase()}`
    });

    if (!targetUri) {
      return;
    }

    await vscode.workspace.fs.writeFile(targetUri, artifact.content);
  }
}
