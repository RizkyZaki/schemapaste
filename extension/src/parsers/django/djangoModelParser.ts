import type {
  NormalizedRelationshipDefinition,
  NormalizedSchemaModel,
  NormalizedTableDefinition,
  SchemaParseResult
} from "../../types/normalizedSchema";
import type { SchemaParserAdapter } from "../registry/types";

const CLASS_REGEX = /class\s+(\w+)\(models\.Model\):([\s\S]*?)(?=\nclass\s+\w+\(models\.Model\):|$)/g;
const FIELD_REGEX = /\n\s{2,}(\w+)\s*=\s*models\.(\w+)\(([^)]*)\)/g;

function inferType(fieldType: string): string {
  if (["AutoField", "BigAutoField", "IntegerField", "BigIntegerField", "PositiveIntegerField"].includes(fieldType)) {
    return "int";
  }
  if (["BooleanField"].includes(fieldType)) {
    return "boolean";
  }
  if (["DateField", "DateTimeField", "TimeField"].includes(fieldType)) {
    return "datetime";
  }
  if (["JSONField"].includes(fieldType)) {
    return "json";
  }
  return "varchar";
}

export class DjangoModelParser implements SchemaParserAdapter {
  readonly sourceType = "django" as const;

  parse(source: string): SchemaParseResult {
    CLASS_REGEX.lastIndex = 0;

    const tables: NormalizedTableDefinition[] = [];
    const relationships: NormalizedRelationshipDefinition[] = [];

    let classMatch: RegExpExecArray | null;
    while ((classMatch = CLASS_REGEX.exec(source)) !== null) {
      const className = classMatch[1] ?? "";
      const body = classMatch[2] ?? "";
      if (!className) {
        continue;
      }

      const tableName = className;
      const columns: NormalizedTableDefinition["columns"] = [];
      const primaryKeys: string[] = [];
      const indexes: NormalizedTableDefinition["indexes"] = [];
      const foreignKeys: NormalizedTableDefinition["foreignKeys"] = [];

      FIELD_REGEX.lastIndex = 0;
      let fieldMatch: RegExpExecArray | null;
      while ((fieldMatch = FIELD_REGEX.exec(body)) !== null) {
        const fieldName = fieldMatch[1] ?? "";
        const fieldType = fieldMatch[2] ?? "";
        const fieldArgs = fieldMatch[3] ?? "";
        if (!fieldName || !fieldType) {
          continue;
        }

        if (fieldType === "ForeignKey" || fieldType === "OneToOneField") {
          const targetClass = /(^|,)\s*([A-Z]\w*)\s*(,|$)/.exec(fieldArgs)?.[2];
          if (!targetClass) {
            continue;
          }

          const sourceColumn = /db_column\s*=\s*["'`]([^"'`]+)["'`]/.exec(fieldArgs)?.[1] ?? `${fieldName}_id`;
          const targetColumn = "id";

          foreignKeys.push({
            sourceTable: tableName,
            sourceColumn,
            targetTable: targetClass,
            targetColumn
          });

          relationships.push({
            id: `${tableName}.${sourceColumn}->${targetClass}.${targetColumn}`,
            sourceTable: tableName,
            sourceColumn,
            targetTable: targetClass,
            targetColumn,
            cardinality: fieldType === "OneToOneField" ? "1:1" : "N:1",
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

        const isPrimaryKey = fieldArgs.includes("primary_key=True") || fieldType === "AutoField" || fieldType === "BigAutoField";
        const isUnique = fieldArgs.includes("unique=True");
        const nullable = fieldArgs.includes("null=True") || fieldArgs.includes("blank=True");

        columns.push({
          name: fieldName,
          dataType: inferType(fieldType),
          nullable,
          defaultValue: undefined,
          isPrimaryKey,
          isUnique
        });

        if (isPrimaryKey) {
          primaryKeys.push(fieldName);
        }
        if (isUnique) {
          indexes.push({ columns: [fieldName], unique: true });
        }
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
        issues: [{ level: "error", message: "No Django models.Model classes were detected." }]
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
