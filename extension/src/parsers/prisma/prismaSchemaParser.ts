import type {
  NormalizedRelationshipDefinition,
  NormalizedSchemaModel,
  NormalizedTableDefinition,
  SchemaParseResult
} from "../../types/normalizedSchema";
import type { SchemaParserAdapter } from "../registry/types";

const MODEL_REGEX = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
const RELATION_REGEX = /@(relation)?\(([^)]*)\)/;

function inferScalarType(typeName: string): string {
  const type = typeName.replace(/[?\[\]]/g, "");
  if (["Int", "BigInt"].includes(type)) {
    return "int";
  }
  if (["String", "Bytes"].includes(type)) {
    return "varchar";
  }
  if (type === "Boolean") {
    return "boolean";
  }
  if (["DateTime"].includes(type)) {
    return "datetime";
  }
  if (["Decimal", "Float"].includes(type)) {
    return "decimal";
  }
  if (type === "Json") {
    return "json";
  }
  return type.toLowerCase();
}

export class PrismaSchemaParser implements SchemaParserAdapter {
  readonly sourceType = "prisma" as const;

  parse(source: string): SchemaParseResult {
    MODEL_REGEX.lastIndex = 0;

    const tables: NormalizedTableDefinition[] = [];
    const relationships: NormalizedRelationshipDefinition[] = [];

    let match: RegExpExecArray | null;
    while ((match = MODEL_REGEX.exec(source)) !== null) {
      const modelName = match[1] ?? "";
      const block = match[2] ?? "";
      if (!modelName) {
        continue;
      }

      const columns: NormalizedTableDefinition["columns"] = [];
      const primaryKeys: string[] = [];
      const indexes: NormalizedTableDefinition["indexes"] = [];
      const foreignKeys: NormalizedTableDefinition["foreignKeys"] = [];

      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("//") && !line.startsWith("@@"));

      for (const line of lines) {
        const parts = line.split(/\s+/);
        const fieldName = parts[0] ?? "";
        const fieldType = parts[1] ?? "";
        if (!fieldName || !fieldType) {
          continue;
        }

        const attributes = parts.slice(2).join(" ");
        const isModelRelation = /^[A-Z]/.test(fieldType.replace(/[?\[\]]/g, ""));
        const relationMatch = RELATION_REGEX.exec(attributes);

        if (isModelRelation) {
          if (!relationMatch) {
            continue;
          }

          const relationArgs = relationMatch[2] ?? "";
          const fieldsArg = /fields\s*:\s*\[([^\]]+)\]/.exec(relationArgs)?.[1];
          const refsArg = /references\s*:\s*\[([^\]]+)\]/.exec(relationArgs)?.[1];
          if (!fieldsArg || !refsArg) {
            continue;
          }

          const sourceColumn = fieldsArg.split(",")[0]?.trim();
          const targetColumn = refsArg.split(",")[0]?.trim();
          const targetTable = fieldType.replace(/[?\[\]]/g, "");
          if (!sourceColumn || !targetColumn) {
            continue;
          }

          foreignKeys.push({
            sourceTable: modelName,
            sourceColumn,
            targetTable,
            targetColumn
          });

          relationships.push({
            id: `${modelName}.${sourceColumn}->${targetTable}.${targetColumn}`,
            sourceTable: modelName,
            sourceColumn,
            targetTable,
            targetColumn,
            cardinality: fieldType.includes("[]") ? "N:N" : "N:1",
            label: `${sourceColumn} -> ${targetColumn}`,
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

          continue;
        }

        const isPrimaryKey = attributes.includes("@id");
        const isUnique = attributes.includes("@unique");
        const nullable = fieldType.includes("?");

        columns.push({
          name: fieldName,
          dataType: inferScalarType(fieldType),
          nullable,
          defaultValue: undefined,
          isPrimaryKey,
          isUnique
        });

        if (isPrimaryKey) {
          primaryKeys.push(fieldName);
        }

        if (isUnique) {
          indexes.push({
            columns: [fieldName],
            unique: true
          });
        }
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
        issues: [{ level: "error", message: "No Prisma model blocks were detected." }]
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
