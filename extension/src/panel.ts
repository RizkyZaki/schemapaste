import * as vscode from "vscode";
import { getPersistedPanelState, SchemaPasteWebviewSession } from "./webviewSession";

const PANEL_VIEW_TYPE = "schemapaste.erdPanel";
export class SchemaPastePanel {
  private static currentPanel: SchemaPastePanel | undefined;

  static createOrShow(context: vscode.ExtensionContext): void {
    const column = vscode.window.activeTextEditor?.viewColumn;
    if (SchemaPastePanel.currentPanel) {
      SchemaPastePanel.currentPanel.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(PANEL_VIEW_TYPE, "SchemaPaste ERD", column ?? vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "webview-dist")]
    });

    const persistedState = getPersistedPanelState(context);
    SchemaPastePanel.currentPanel = new SchemaPastePanel(panel, context, persistedState);

    // Keep the ERD panel focused and maximize editor area for an immediate fullscreen-like experience.
    void vscode.commands.executeCommand("workbench.action.closeSidebar");
    void vscode.commands.executeCommand("workbench.action.closeAuxiliaryBar");
  }

  static registerSerializer(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerWebviewPanelSerializer(PANEL_VIEW_TYPE, {
      async deserializeWebviewPanel(panel, state) {
        const persistedState = getPersistedPanelState(context);
        SchemaPastePanel.currentPanel = new SchemaPastePanel(
          panel,
          context,
          (state as ReturnType<typeof getPersistedPanelState>) ?? persistedState
        );
      }
    });
  }

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    initialState?: ReturnType<typeof getPersistedPanelState>
  ) {
    const session = new SchemaPasteWebviewSession(this.panel.webview, context, initialState);
    const subscription = session.attach();

    this.panel.onDidDispose(() => {
      subscription.dispose();
      SchemaPastePanel.currentPanel = undefined;
    });
  }
}
