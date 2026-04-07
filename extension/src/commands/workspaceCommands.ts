import * as vscode from "vscode";
import type { WorkspaceExportFormat } from "../exporters/types";
import type { SchemaSourceType } from "../types/normalizedSchema";
import { WorkspaceExportService } from "../exporters/exportService";
import { WorkspaceRepository } from "../storage/workspaceRepository";
import { SCHEMAPASTE_CUSTOM_EDITOR_VIEW_TYPE } from "../custom-editor/workspaceEditorProvider";
import { WorkspaceHistoryTreeProvider } from "../sidebar/workspaceTreeProvider";
import { createDefaultParserRegistry } from "../parsers/registry/createDefaultParserRegistry";

const SUPPORTED_SOURCES: SchemaSourceType[] = [
  "sql",
  "laravel",
  "prisma",
  "drizzle",
  "typeorm",
  "sequelize",
  "django"
];

export function registerWorkspaceCommands(
  context: vscode.ExtensionContext,
  repository: WorkspaceRepository,
  historyProvider: WorkspaceHistoryTreeProvider,
  exportService: WorkspaceExportService
): void {
  const parserRegistry = createDefaultParserRegistry();

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.newWorkspace", async () => {
      const sourceType = await pickSourceType();
      if (!sourceType) {
        return;
      }

      const source = "";
      const parser = parserRegistry.resolve(sourceType);
      const parsed = parser.parse(source);

      const created = await repository.create({
        name: "Untitled ERD",
        sourceType,
        originalSourceContent: source,
        normalizedSchema:
          parsed.schema ?? {
            sourceType,
            tables: [],
            enums: [],
            relationships: []
          }
      });

      await openWorkspaceInCustomEditor(created.id);
      historyProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.openWorkspace", async (workspaceId?: string) => {
      if (workspaceId) {
        await openWorkspaceInCustomEditor(workspaceId);
        return;
      }

      const workspaces = await repository.list();
      const picked = await vscode.window.showQuickPick(
        workspaces.map((workspace) => ({
          label: workspace.name,
          description: workspace.sourceType,
          detail: workspace.updatedAt,
          id: workspace.id
        })),
        { placeHolder: "Select workspace to open" }
      );

      if (!picked) {
        return;
      }

      await openWorkspaceInCustomEditor(picked.id);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.renameWorkspace", async (workspaceId?: string) => {
      const id = workspaceId ?? (await pickWorkspaceId(repository));
      if (!id) {
        return;
      }

      const existing = repository.getById(id);
      if (!existing) {
        return;
      }

      const nextName = await vscode.window.showInputBox({
        value: existing.name,
        placeHolder: "New workspace name"
      });

      if (!nextName || nextName.trim().length === 0) {
        return;
      }

      await repository.rename(id, nextName.trim());
      historyProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.duplicateWorkspace", async (workspaceId?: string) => {
      const id = workspaceId ?? (await pickWorkspaceId(repository));
      if (!id) {
        return;
      }

      const duplicated = await repository.duplicate(id);
      if (!duplicated) {
        return;
      }

      historyProvider.refresh();
      await openWorkspaceInCustomEditor(duplicated.id);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.deleteWorkspace", async (workspaceId?: string) => {
      const id = workspaceId ?? (await pickWorkspaceId(repository));
      if (!id) {
        return;
      }

      const confirm = await vscode.window.showWarningMessage(
        "Delete this workspace from SchemaPaste history?",
        { modal: true },
        "Delete"
      );

      if (confirm !== "Delete") {
        return;
      }

      await repository.delete(id);
      historyProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.togglePinWorkspace", async (workspaceId?: string) => {
      const id = workspaceId ?? (await pickWorkspaceId(repository));
      if (!id) {
        return;
      }

      const existing = repository.getById(id);
      if (!existing) {
        return;
      }

      await repository.setPinned(id, !existing.pinned);
      historyProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.searchWorkspace", async () => {
      const query = await vscode.window.showInputBox({ placeHolder: "Search workspace history" });
      historyProvider.setSearch(query ?? "");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.sortWorkspace", async () => {
      await historyProvider.toggleSort();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.exportWorkspace", async (workspaceId?: string) => {
      const id = workspaceId ?? (await pickWorkspaceId(repository));
      if (!id) {
        return;
      }

      const existing = repository.getById(id);
      if (!existing) {
        return;
      }

      const format = await pickExportFormat();
      if (!format) {
        return;
      }

      await exportService.exportToFile(existing, format);
    })
  );

  async function openWorkspaceInCustomEditor(workspaceId: string): Promise<void> {
    const uri = vscode.Uri.parse(`untitled:SchemaPaste-${workspaceId}.schemapaste?workspaceId=${workspaceId}`);
    await vscode.commands.executeCommand("vscode.openWith", uri, SCHEMAPASTE_CUSTOM_EDITOR_VIEW_TYPE, {
      preview: false
    });
  }
}

async function pickWorkspaceId(repository: WorkspaceRepository): Promise<string | undefined> {
  const workspaces = await repository.list();
  const picked = await vscode.window.showQuickPick(
    workspaces.map((workspace) => ({
      label: workspace.name,
      description: workspace.sourceType,
      id: workspace.id
    })),
    { placeHolder: "Select workspace" }
  );

  return picked?.id;
}

async function pickSourceType(): Promise<SchemaSourceType | undefined> {
  const picked = await vscode.window.showQuickPick(
    SUPPORTED_SOURCES.map((sourceType) => ({ label: sourceType.toUpperCase(), sourceType })),
    { placeHolder: "Select source type" }
  );
  return picked?.sourceType;
}

async function pickExportFormat(): Promise<WorkspaceExportFormat | undefined> {
  const options: WorkspaceExportFormat[] = [
    "png",
    "svg",
    "pdf",
    "json",
    "normalized-json",
    "source",
    "markdown",
    "sql",
    "laravel",
    "prisma",
    "drizzle",
    "typeorm",
    "sequelize",
    "django"
  ];

  const picked = await vscode.window.showQuickPick(options.map((format) => ({ label: format.toUpperCase(), format })), {
    placeHolder: "Choose export format"
  });

  return picked?.format;
}
