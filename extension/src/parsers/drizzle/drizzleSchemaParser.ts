import type {
  NormalizedRelationshipDefinition,
  NormalizedSchemaModel,
  NormalizedTableDefinition,
  SchemaParseResult
} from "../../types/normalizedSchema";
import type { SchemaParserAdapter } from "../registry/types";

const TABLE_REGEX = /(?:export\s+)?const\s+(\w+)\s*=\s*\w+Table\(\s*["'`]([^"'`]+)["'`]\s*,\s*\{([\s\S]*?)\}\s*\)/g;
const COLUMN_REGEX = /(\w+)\s*:\s*([^,\n]+(?:\([^)]*\))?(?:\.[^,\n]+)*)/g;

function inferType(definition: string): string {
  if (definition.includes("serial") || definition.includes("integer") || definition.includes("int")) {
    return "int";
  }
  if (definition.includes("varchar") || definition.includes("text")) {
    return "varchar";
  }
  if (definition.includes("boolean")) {
    return "boolean";
  }
  if (definition.includes("timestamp") || definition.includes("date")) {
    return "datetime";
  }
  if (definition.includes("json")) {
    return "json";
  }
  return "text";
}

export class DrizzleSchemaParser implements SchemaParserAdapter {
  readonly sourceType = "drizzle" as const;

  parse(source: string): SchemaParseResult {
    TABLE_REGEX.lastIndex = 0;

    const variableToTable = new Map<string, string>();
    const tables: NormalizedTableDefinition[] = [];
    const relationships: NormalizedRelationshipDefinition[] = [];

    let tableMatch: RegExpExecArray | null;
    while ((tableMatch = TABLE_REGEX.exec(source)) !== null) {
      const variableName = tableMatch[1] ?? "";
      const tableName = tableMatch[2] ?? "";
      const block = tableMatch[3] ?? "";
      if (!variableName || !tableName) {
        continue;
      }

      variableToTable.set(variableName, tableName);

      const columns: NormalizedTableDefinition["columns"] = [];
      const primaryKeys: string[] = [];
      const indexes: NormalizedTableDefinition["indexes"] = [];
      const foreignKeys: NormalizedTableDefinition["foreignKeys"] = [];

      COLUMN_REGEX.lastIndex = 0;
      let columnMatch: RegExpExecArray | null;
      while ((columnMatch = COLUMN_REGEX.exec(block)) !== null) {
        const columnName = columnMatch[1] ?? "";
        const definition = columnMatch[2] ?? "";
        if (!columnName || !definition) {
          continue;
        }

        const isPrimaryKey = definition.includes("primaryKey()");
        const isUnique = definition.includes("unique()");
        const nullable = !definition.includes("notNull()");

        columns.push({
          name: columnName,
          dataType: inferType(definition),
          nullable,
          defaultValue: undefined,
          isPrimaryKey,
          isUnique
        });

        if (isPrimaryKey) {
          primaryKeys.push(columnName);
        }
        if (isUnique) {
          indexes.push({ columns: [columnName], unique: true });
        }

        const refMatch = /references\(\s*\(\)\s*=>\s*(\w+)\.(\w+)\s*\)/.exec(definition);
        if (!refMatch) {
          continue;
        }

        const targetVar = refMatch[1] ?? "";
        const targetColumn = refMatch[2] ?? "";
        const targetTable = variableToTable.get(targetVar) ?? targetVar;
        if (!targetTable || !targetColumn) {
          continue;
        }

        foreignKeys.push({
          sourceTable: tableName,
          sourceColumn: columnName,
          targetTable,
          targetColumn
        });

        relationships.push({
          id: `${tableName}.${columnName}->${targetTable}.${targetColumn}`,
          sourceTable: tableName,
          sourceColumn: columnName,
          targetTable,
          targetColumn,
          cardinality: "N:1",
          label: `${columnName} -> ${targetColumn}`,
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
        });
      }

      tables.push({
        name: tableName,
        columns,
        primaryKeys,
        indexes,
        foreignKeys
      });
    }

    if (tables.length === 0) {
      return {
        schema: null,
        issues: [{ level: "error", message: "No Drizzle table definitions were detected." }]
      };
    }

    const schema: NormalizedSchemaModel = {
      sourceType: this.sourceType,
      tables,
      enums: [],
      relationships
    };

    return {
      schema,
      issues: []
    };
  }
}
