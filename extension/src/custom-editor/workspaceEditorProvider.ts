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
    const params = new URLSearchParams(document.uri.query);
    const workspaceId = params.get("workspaceId");
    const workspace = workspaceId ? this.repository.getById(workspaceId) : undefined;

    panel.title = workspace ? `${workspace.name} · SchemaPaste` : "Untitled ERD · SchemaPaste";

    const sourceType: SchemaSourceType = workspace?.sourceType ?? "sql";
    const source = workspace?.originalSourceContent ?? document.getText();
    const parser = this.parserRegistry.resolve(sourceType);
    const parsed = parser.parse(source);

    const session = new SchemaPasteWebviewSession(
      panel.webview,
      this.context,
      {
        sql: source,
        dialect: "mysql",
        sourceType,
        graph: parsed.schema ? normalizedSchemaToGraph(parsed.schema) : undefined,
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
  }
}
