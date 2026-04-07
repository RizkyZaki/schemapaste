import type {
  NormalizedRelationshipDefinition,
  NormalizedSchemaModel,
  NormalizedTableDefinition,
  SchemaParseIssue,
  SchemaParseResult
} from "../../types/normalizedSchema";
import type { SchemaParserAdapter } from "../registry/types";

const CREATE_TABLE_REGEX = /Schema::create\(\s*['\"]([^'\"]+)['\"]\s*,\s*function\s*\([^)]*\)\s*\{([\s\S]*?)\}\s*\);/gm;
const COLUMN_REGEX = /\$table->([a-zA-Z_][a-zA-Z0-9_]*)\(([^;]*)\);/g;
const FOREIGN_REGEX = /\$table->foreign\(['\"]([^'\"]+)['\"]\)\s*->\s*references\(['\"]([^'\"]+)['\"]\)\s*->\s*on\(['\"]([^'\"]+)['\"]\)/g;

function cleanArg(value: string): string {
  return value.trim().replace(/^['\"]|['\"]$/g, "");
}

function inferColumnName(method: string, rawArgs: string): string {
  const parts = rawArgs.split(",").map((item) => cleanArg(item));
  if (parts[0]) {
    return parts[0];
  }

  if (method === "id" || method === "bigIncrements") {
    return "id";
  }

  return method;
}

function inferDataType(method: string): string {
  if (["id", "bigIncrements", "increments"].includes(method)) {
    return "bigint";
  }

  if (["string", "char", "text", "longText", "mediumText"].includes(method)) {
    return "varchar";
  }

  if (["integer", "bigInteger", "unsignedBigInteger", "unsignedInteger"].includes(method)) {
    return "int";
  }

  if (["boolean"].includes(method)) {
    return "boolean";
  }

  if (["date", "datetime", "timestamp"].includes(method)) {
    return method;
  }

  if (["json", "jsonb"].includes(method)) {
    return "json";
  }

  return method;
}

function parseTable(tableName: string, block: string): { table: NormalizedTableDefinition; issues: SchemaParseIssue[] } {
  const columns: NormalizedTableDefinition["columns"] = [];
  const foreignKeys: NormalizedTableDefinition["foreignKeys"] = [];
  const primaryKeys: string[] = [];
  const indexes: NormalizedTableDefinition["indexes"] = [];
  const issues: SchemaParseIssue[] = [];

  COLUMN_REGEX.lastIndex = 0;
  FOREIGN_REGEX.lastIndex = 0;

  let columnMatch: RegExpExecArray | null;
  while ((columnMatch = COLUMN_REGEX.exec(block)) !== null) {
    const method = columnMatch[1] ?? "";
    const rawArgs = columnMatch[2] ?? "";

    if (!method) {
      continue;
    }

    if (method === "foreign") {
      continue;
    }

    const name = inferColumnName(method, rawArgs);
    const dataType = inferDataType(method);
    const isPrimaryKey = method === "id" || method === "bigIncrements" || method === "increments";

    if (isPrimaryKey) {
      primaryKeys.push(name);
    }

    columns.push({
      name,
      dataType,
      nullable: !rawArgs.includes("->nullable()"),
      defaultValue: undefined,
      isPrimaryKey,
      isUnique: rawArgs.includes("->unique()")
    });

    if (rawArgs.includes("->unique()")) {
      indexes.push({ unique: true, columns: [name] });
    }
  }

  let foreignMatch: RegExpExecArray | null;
  while ((foreignMatch = FOREIGN_REGEX.exec(block)) !== null) {
    const sourceColumn = foreignMatch[1] ?? "";
    const targetColumn = foreignMatch[2] ?? "";
    const targetTable = foreignMatch[3] ?? "";

    if (!sourceColumn || !targetColumn || !targetTable) {
      continue;
    }

    foreignKeys.push({
      sourceTable: tableName,
      sourceColumn,
      targetTable,
      targetColumn
    });
  }

  if (columns.length === 0) {
    issues.push({
      level: "warning",
      message: `No columns detected in Laravel migration table '${tableName}'.`
    });
  }

  return {
    table: {
      name: tableName,
      columns,
      primaryKeys,
      indexes,
      foreignKeys
    },
    issues
  };
}

export class LaravelMigrationParser implements SchemaParserAdapter {
  readonly sourceType = "laravel" as const;

  parse(source: string): SchemaParseResult {
    CREATE_TABLE_REGEX.lastIndex = 0;

    const tables: NormalizedTableDefinition[] = [];
    const issues: SchemaParseIssue[] = [];

    let match: RegExpExecArray | null;
    while ((match = CREATE_TABLE_REGEX.exec(source)) !== null) {
      const tableName = match[1] ?? "";
      const block = match[2] ?? "";

      if (!tableName) {
        continue;
      }

      const parsed = parseTable(tableName, block);
      tables.push(parsed.table);
      issues.push(...parsed.issues);
    }

    if (tables.length === 0) {
      return {
        schema: null,
        issues: [
          {
            level: "error",
            message: "No Laravel Schema::create blocks were detected."
          }
        ]
      };
    }

    const relationships: NormalizedRelationshipDefinition[] = tables.flatMap((table) =>
      table.foreignKeys.map((key) => ({
        id: `${key.sourceTable}.${key.sourceColumn}->${key.targetTable}.${key.targetColumn}`,
        sourceTable: key.sourceTable,
        sourceColumn: key.sourceColumn,
        targetTable: key.targetTable,
        targetColumn: key.targetColumn,
        cardinality: "N:1",
        label: `${key.sourceColumn} -> ${key.targetColumn}`,
        line: {
          style: "smooth",
          color: "#67E8F9",
          thickness: 2,
          dashed: false,
          labelVisible: true,
          cardinalityVisible: true,
          highlighted: false,
          reroutePoints: []
        }
      }))
    );

    const schema: NormalizedSchemaModel = {
      sourceType: this.sourceType,
      tables,
      enums: [],
      relationships
    };

    return {
      schema,
      issues
    };
  }
}
