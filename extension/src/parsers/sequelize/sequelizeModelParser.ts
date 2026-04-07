import type {
  NormalizedRelationshipDefinition,
  NormalizedSchemaModel,
  NormalizedTableDefinition,
  SchemaParseResult
} from "../../types/normalizedSchema";
import type { SchemaParserAdapter } from "../registry/types";

const DEFINE_REGEX = /(?:sequelize\.)?define\(\s*["'`](\w+)["'`]\s*,\s*\{([\s\S]*?)\}\s*\)/g;
const ATTRIBUTE_REGEX = /(\w+)\s*:\s*\{([\s\S]*?)\}(?:,|$)/g;

function inferType(block: string): string {
  const typeRaw = /type\s*:\s*([\w.]+)/.exec(block)?.[1] ?? "STRING";
  if (typeRaw.includes("INT")) {
    return "int";
  }
  if (typeRaw.includes("BOOL")) {
    return "boolean";
  }
  if (typeRaw.includes("DATE") || typeRaw.includes("TIME")) {
    return "datetime";
  }
  if (typeRaw.includes("JSON")) {
    return "json";
  }
  return "varchar";
}

export class SequelizeModelParser implements SchemaParserAdapter {
  readonly sourceType = "sequelize" as const;

  parse(source: string): SchemaParseResult {
    DEFINE_REGEX.lastIndex = 0;

    const tables: NormalizedTableDefinition[] = [];
    const relationships: NormalizedRelationshipDefinition[] = [];

    let modelMatch: RegExpExecArray | null;
    while ((modelMatch = DEFINE_REGEX.exec(source)) !== null) {
      const modelName = modelMatch[1] ?? "";
      const block = modelMatch[2] ?? "";
      if (!modelName) {
        continue;
      }

      const columns: NormalizedTableDefinition["columns"] = [];
      const primaryKeys: string[] = [];
      const indexes: NormalizedTableDefinition["indexes"] = [];
      const foreignKeys: NormalizedTableDefinition["foreignKeys"] = [];

      ATTRIBUTE_REGEX.lastIndex = 0;
      let attrMatch: RegExpExecArray | null;
      while ((attrMatch = ATTRIBUTE_REGEX.exec(block)) !== null) {
        const columnName = attrMatch[1] ?? "";
        const attrBlock = attrMatch[2] ?? "";
        if (!columnName) {
          continue;
        }

        const isPrimaryKey = attrBlock.includes("primaryKey: true");
        const isUnique = attrBlock.includes("unique: true");
        const nullable = !attrBlock.includes("allowNull: false");

        columns.push({
          name: columnName,
          dataType: inferType(attrBlock),
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

        const targetTable = /model\s*:\s*["'`]([^"'`]+)["'`]/.exec(attrBlock)?.[1];
        const targetColumn = /key\s*:\s*["'`]([^"'`]+)["'`]/.exec(attrBlock)?.[1] ?? "id";
        if (!targetTable) {
          continue;
        }

        foreignKeys.push({
          sourceTable: modelName,
          sourceColumn: columnName,
          targetTable,
          targetColumn
        });

        relationships.push({
          id: `${modelName}.${columnName}->${targetTable}.${targetColumn}`,
          sourceTable: modelName,
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
        name: modelName,
        columns,
        primaryKeys,
        indexes,
        foreignKeys
      });
    }

    if (tables.length === 0) {
      return {
        schema: null,
        issues: [{ level: "error", message: "No Sequelize model definitions were detected." }]
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
