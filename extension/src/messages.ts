import type { BackendMigrationTarget, ErdGraph, SchemaModel, SqlDialect } from "@schemapaste/core";
import type { SchemaParseIssue, SchemaSourceType } from "./types/normalizedSchema";

export type WebviewToExtensionMessage =
  | {
      type: "saveSchema";
      payload: {
        schema: SchemaModel;
        sql: string;
      };
    }
  | {
      type: "loadSchema";
    }
  | {
      type: "exportFile";
      payload:
        | {
            format: "svg";
            content: string;
          }
        | {
            format: "png";
            contentBase64: string;
          };
    }
  | {
      type: "exportMigration";
      payload: {
        target: BackendMigrationTarget;
        schema: SchemaModel;
      };
    }
  | {
      type: "persistState";
      payload: {
        sql: string;
        dialect: SqlDialect;
        sourceType: SchemaSourceType;
      };
    }
  | {
      type: "parseSource";
      payload: {
        source: string;
        sourceType: SchemaSourceType;
        dialect: SqlDialect;
      };
    }
  | {
      type: "ready";
    };

export type ExtensionToWebviewMessage =
  | {
      type: "schemaLoaded";
      payload: {
        json: string;
      };
    }
  | {
      type: "restoreState";
      payload: {
        sql: string;
        dialect: SqlDialect;
        sourceType: SchemaSourceType;
        graph?: ErdGraph;
        parserIssues?: SchemaParseIssue[];
      };
    }
  | {
      type: "parsedGraph";
      payload: {
        graph: ErdGraph;
        parserIssues: SchemaParseIssue[];
      };
    }
  | {
      type: "operationResult";
      payload: {
        success: boolean;
        message: string;
      };
    };
