import * as vscode from "vscode";
import { SchemaPastePanel } from "./panel";
import { SCHEMAPASTE_SIDEBAR_VIEW_ID, SchemaPasteSidebarProvider } from "./sidebar";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SCHEMAPASTE_SIDEBAR_VIEW_ID, new SchemaPasteSidebarProvider(context))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("schemapaste.openErd", () => {
      SchemaPastePanel.createOrShow(context);
    })
  );

  context.subscriptions.push(SchemaPastePanel.registerSerializer(context));
}

export function deactivate(): void {
  // no-op
}
