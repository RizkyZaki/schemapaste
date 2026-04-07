import * as vscode from "vscode";
import { getPersistedPanelState, SchemaPasteWebviewSession } from "./webviewSession";

export const SCHEMAPASTE_SIDEBAR_VIEW_ID = "schemapaste.sidebarView";

export class SchemaPasteSidebarProvider implements vscode.WebviewViewProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "webview-dist")]
    };

    const session = new SchemaPasteWebviewSession(
      webviewView.webview,
      this.context,
      getPersistedPanelState(this.context)
    );

    const subscription = session.attach();
    webviewView.onDidDispose(() => {
      subscription.dispose();
    });
  }
}
