import * as vscode from "vscode";
import { SchemaPasteWebviewSession } from "../webviewSession";
import type { SchemaSourceType } from "../types/normalizedSchema";
import { WorkspaceRepository } from "../storage/workspaceRepository";
import { createDefaultParserRegistry } from "../parsers/registry/createDefaultParserRegistry";
import { normalizedSchemaToGraph } from "../webview/normalizedToGraph";

export const SCHEMAPASTE_CUSTOM_EDITOR_VIEW_TYPE = "schemapaste.erdWorkspaceEditor";

export class WorkspaceCustomEditorProvider implements vscode.CustomTextEditorProvider {
  private readonly parserRegistry = createDefaultParserRegistry();

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly repository: WorkspaceRepository
  ) {}

  static register(context: vscode.ExtensionContext, repository: WorkspaceRepository): vscode.Disposable {
    const provider = new WorkspaceCustomEditorProvider(context, repository);

    return vscode.window.registerCustomEditorProvider(SCHEMAPASTE_CUSTOM_EDITOR_VIEW_TYPE, provider, {
      webviewOptions: {
        retainContextWhenHidden: true,
        enableFindWidget: true
      },
      supportsMultipleEditorsPerDocument: true
    });
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    panel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "webview-dist")]
    };

    try {
      const workspaceId = this.getWorkspaceId(document.uri);
      const workspace = workspaceId ? this.repository.getById(workspaceId) : undefined;

      panel.title = workspace ? `${workspace.name} · SchemaPaste` : "Untitled ERD · SchemaPaste";

      const sourceType: SchemaSourceType = workspace?.sourceType ?? "sql";
      const source = workspace?.originalSourceContent ?? document.getText();
      const parser = this.parserRegistry.resolve(sourceType);
      const parsed = parser.parse(source);
      const initialGraph = parsed.schema
        ? normalizedSchemaToGraph(parsed.schema)
        : workspace?.normalizedSchema
          ? normalizedSchemaToGraph(workspace.normalizedSchema)
          : undefined;

      const session = new SchemaPasteWebviewSession(
        panel.webview,
        this.context,
        {
          sql: source,
          dialect: "mysql",
          sourceType,
          graph: initialGraph,
          parserIssues: parsed.issues
        },
        {
          onPersistState: async (state) => {
            if (!workspaceId) {
              return;
            }

            const existing = this.repository.getById(workspaceId);
            if (!existing) {
              return;
            }

            const parser = this.parserRegistry.resolve(state.sourceType);
            const parsed = parser.parse(state.sql);

            if (parsed.schema) {
              existing.normalizedSchema = parsed.schema;
            }

            existing.sourceType = state.sourceType;
            existing.originalSourceContent = state.sql;
            existing.updatedAt = new Date().toISOString();
            await this.repository.upsert(existing);
          },
          onParseSource: async (nextSource, nextSourceType) => {
            const parser = this.parserRegistry.resolve(nextSourceType);
            const parsed = parser.parse(nextSource);
            return {
              graph: parsed.schema
                ? normalizedSchemaToGraph(parsed.schema)
                : {
                    nodes: [],
                    edges: []
                  },
              parserIssues: parsed.issues
            };
          }
        }
      );

      const disposable = session.attach();
      panel.onDidDispose(() => {
        disposable.dispose();
      });
    } catch (error) {
      const text = error instanceof Error ? error.stack ?? error.message : String(error);
      panel.webview.html = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: sans-serif; padding: 16px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }
          pre { white-space: pre-wrap; background: var(--vscode-textCodeBlock-background); padding: 10px; border-radius: 6px; }
        </style>
      </head>
      <body>
        <h3>SchemaPaste failed to open this workspace</h3>
        <p>Please copy the details below and share it.</p>
        <pre>${this.escapeHtml(text)}</pre>
      </body>
      </html>`;
    }
  }

  private getWorkspaceId(uri: vscode.Uri): string | undefined {
    const params = new URLSearchParams(uri.query);
    const fromQuery = params.get("workspaceId");
    if (fromQuery && fromQuery.length > 0) {
      return fromQuery;
    }

    const fileName = uri.path.split("/").pop() ?? "";
    const fromFileName = /^SchemaPaste-(.+)\.schemapaste$/i.exec(fileName)?.[1];
    if (fromFileName && fromFileName.length > 0) {
      return fromFileName;
    }

    return undefined;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}
