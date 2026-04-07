import type { BackendMigrationTarget, SchemaModel, SqlDialect } from "@schemapaste/core";

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
      };
    }
  | {
      type: "operationResult";
      payload: {
        success: boolean;
        message: string;
      };
    };
