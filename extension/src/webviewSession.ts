import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import {
  type ErdGraph,
  generateBackendMigration,
  serializeSchemaSnapshot,
  suggestedMigrationExtensions,
  suggestedMigrationFileName,
  suggestedMigrationLanguageLabel,
  targetLabel,
  type SqlDialect
} from "@schemapaste/core";
import type { ExtensionToWebviewMessage, WebviewToExtensionMessage } from "./messages";
import type { SchemaParseIssue, SchemaSourceType } from "./types/normalizedSchema";

export interface PersistedPanelState {
  sql: string;
  dialect: SqlDialect;
  sourceType: SchemaSourceType;
  graph?: ErdGraph;
  parserIssues?: SchemaParseIssue[];
}

interface SchemaPasteWebviewSessionHooks {
  onPersistState?: (state: PersistedPanelState) => Promise<void> | void;
  onParseSource?: (
    source: string,
    sourceType: SchemaSourceType,
    dialect: SqlDialect
  ) => Promise<{ graph: ErdGraph; parserIssues: SchemaParseIssue[] }>;
}

const STATE_KEY = "schemapaste.panelState";

export class SchemaPasteWebviewSession {
  private state: PersistedPanelState = {
    sql: "",
    dialect: "mysql",
    sourceType: "sql",
    parserIssues: []
  };

  constructor(
    private readonly webview: vscode.Webview,
    private readonly extensionContext: vscode.ExtensionContext,
    initialState?: PersistedPanelState,
    private readonly hooks?: SchemaPasteWebviewSessionHooks
  ) {
    if (initialState) {
      this.state = initialState;
    }
  }

  attach(): vscode.Disposable {
    this.webview.html = this.getWebviewHtml(this.webview);
    return this.webview.onDidReceiveMessage((message: WebviewToExtensionMessage) => {
      void this.handleMessage(message);
    });
  }

  private async handleMessage(message: WebviewToExtensionMessage): Promise<void> {
    switch (message.type) {
      case "saveSchema": {
        const json = serializeSchemaSnapshot(message.payload.schema, message.payload.sql);
        const uri = await vscode.window.showSaveDialog({
          saveLabel: "Save Schema JSON",
          filters: {
            JSON: ["json"]
          },
          defaultUri: vscode.Uri.file(path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "", "schema.json"))
        });
        if (!uri) {
          return;
        }
        await vscode.workspace.fs.writeFile(uri, Buffer.from(json, "utf8"));
        this.postResult(true, "Schema saved.");
        return;
      }
      case "loadSchema": {
        const picked = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectMany: false,
          filters: {
            JSON: ["json"]
          }
        });
        if (!picked || picked.length === 0) {
          return;
        }

        const selected = picked[0];
        if (!selected) {
          return;
        }

        const bytes = await vscode.workspace.fs.readFile(selected);
        const json = Buffer.from(bytes).toString("utf8");
        this.postMessage({
          type: "schemaLoaded",
          payload: { json }
        });
        this.postResult(true, "Schema loaded.");
        return;
      }
      case "exportFile": {
        const isSvg = message.payload.format === "svg";
        const uri = await vscode.window.showSaveDialog({
          saveLabel: isSvg ? "Export SVG" : "Export PNG",
          filters: isSvg ? { SVG: ["svg"] } : { PNG: ["png"] },
          defaultUri: vscode.Uri.file(path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "", isSvg ? "erd.svg" : "erd.png"))
        });

        if (!uri) {
          return;
        }

        if (message.payload.format === "svg") {
          await vscode.workspace.fs.writeFile(uri, Buffer.from(message.payload.content, "utf8"));
        } else {
          await vscode.workspace.fs.writeFile(uri, Buffer.from(message.payload.contentBase64, "base64"));
        }

        this.postResult(true, "Export completed.");
        return;
      }
      case "persistState": {
        this.state = {
          sql: message.payload.sql,
          dialect: message.payload.dialect,
          sourceType: message.payload.sourceType,
          graph: this.state.graph,
          parserIssues: this.state.parserIssues ?? []
        };
        await this.extensionContext.workspaceState.update(STATE_KEY, this.state);
        await this.hooks?.onPersistState?.(this.state);
        return;
      }
      case "parseSource": {
        if (!this.hooks?.onParseSource) {
          return;
        }

        const parsed = await this.hooks.onParseSource(
          message.payload.source,
          message.payload.sourceType,
          message.payload.dialect
        );

        this.state.graph = parsed.graph;
        this.state.parserIssues = parsed.parserIssues;

        this.postMessage({
          type: "parsedGraph",
          payload: parsed
        });
        return;
      }
      case "exportMigration": {
        const content = generateBackendMigration(message.payload.schema, message.payload.target);
        const filename = suggestedMigrationFileName(message.payload.target);
        const extensions = suggestedMigrationExtensions(message.payload.target);
        const language = suggestedMigrationLanguageLabel(message.payload.target);
        const target = targetLabel(message.payload.target);

        const uri = await vscode.window.showSaveDialog({
          saveLabel: `Export ${target}`,
          filters: {
            [language]: extensions
          },
          defaultUri: vscode.Uri.file(path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "", filename))
        });

        if (!uri) {
          return;
        }

        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, "utf8"));
        this.postResult(true, `${target} export completed.`);
        return;
      }
      case "ready": {
        this.postMessage({
          type: "restoreState",
          payload: this.state
        });
        return;
      }
      default:
        return;
    }
  }

  private postResult(success: boolean, message: string): void {
    this.postMessage({
      type: "operationResult",
      payload: {
        success,
        message
      }
    });
  }

  private postMessage(message: ExtensionToWebviewMessage): void {
    void this.webview.postMessage(message);
  }

  private getWebviewHtml(webview: vscode.Webview): string {
    const devServer = process.env.SCHEMAPASTE_WEBVIEW_DEV_SERVER;
    if (devServer) {
      const nonce = this.createNonce();
      return `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data: blob:; style-src ${webview.cspSource} 'unsafe-inline' http: https:; script-src 'nonce-${nonce}' http: https:; connect-src http: https: ws:; font-src ${webview.cspSource} data:;" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>SchemaPaste</title>
        </head>
        <body>
          <div id="root"></div>
          <script nonce="${nonce}" type="module" src="${devServer}/src/main.tsx"></script>
        </body>
      </html>`;
    }

    const distPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, "webview-dist");
    const manifestUri = vscode.Uri.joinPath(distPath, ".vite", "manifest.json");

    try {
      const manifestRaw = fs.readFileSync(manifestUri.fsPath, "utf8");
      const manifest = JSON.parse(manifestRaw) as Record<string, { file: string; css?: string[] }>;
      const entry = manifest["index.html"];
      if (!entry?.file) {
        throw new Error("Missing Vite manifest entry for index.html");
      }

      const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, entry.file));
      const cssUris = (entry.css ?? []).map((cssFile) => webview.asWebviewUri(vscode.Uri.joinPath(distPath, cssFile)).toString());
      const nonce = this.createNonce();

      return `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data: blob:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; font-src ${webview.cspSource} data:;" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${cssUris.map((uri) => `<link rel="stylesheet" href="${uri}" />`).join("\n")}
          <title>SchemaPaste</title>
        </head>
        <body>
          <div id="root"></div>
          <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
        </body>
      </html>`;
    } catch {
      return `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              background: #111;
              color: #f3f4f6;
              font-family: sans-serif;
              padding: 24px;
            }
            code {
              background: #1f2937;
              padding: 2px 6px;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <h2>SchemaPaste webview not built</h2>
          <p>Run <code>pnpm build</code> from the monorepo root, then reopen this panel.</p>
        </body>
      </html>`;
    }
  }

  private createNonce(): string {
    const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let index = 0; index < 32; index += 1) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return result;
  }
}

export function getPersistedPanelState(context: vscode.ExtensionContext): PersistedPanelState | undefined {
  return context.workspaceState.get<PersistedPanelState>(STATE_KEY);
}
