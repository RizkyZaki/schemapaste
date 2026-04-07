import type {
  NormalizedRelationshipDefinition,
  NormalizedSchemaModel,
  NormalizedTableDefinition,
  SchemaParseResult
} from "../../types/normalizedSchema";
import type { SchemaParserAdapter } from "../registry/types";

const ENTITY_REGEX = /@Entity\(([^)]*)\)\s*export\s+class\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
const COLUMN_DECORATOR_REGEX = /@(PrimaryGeneratedColumn|PrimaryColumn|Column)\(([^)]*)\)\s*\n\s*(\w+)\s*:\s*([\w\[\]]+)/g;
const MANY_TO_ONE_REGEX = /@ManyToOne\(\s*\(\)\s*=>\s*(\w+)\s*[^)]*\)\s*(?:\n\s*@JoinColumn\(([^)]*)\))?\s*\n\s*(\w+)\s*:/g;

function extractTableName(entityArgs: string, className: string): string {
  const tableFromArgs = /["'`]([^"'`]+)["'`]/.exec(entityArgs)?.[1];
  return tableFromArgs ?? className;
}

function inferType(typeAnnotation: string, decoratorArgs: string): string {
  if (decoratorArgs.includes("int") || typeAnnotation === "number") {
    return "int";
  }
  if (decoratorArgs.includes("bool") || typeAnnotation === "boolean") {
    return "boolean";
  }
  if (decoratorArgs.includes("date") || decoratorArgs.includes("time") || typeAnnotation === "Date") {
    return "datetime";
  }
  if (decoratorArgs.includes("json")) {
    return "json";
  }
  return "varchar";
}

export class TypeOrmEntityParser implements SchemaParserAdapter {
  readonly sourceType = "typeorm" as const;

  parse(source: string): SchemaParseResult {
    ENTITY_REGEX.lastIndex = 0;

    const tables: NormalizedTableDefinition[] = [];
    const relationships: NormalizedRelationshipDefinition[] = [];

    let entityMatch: RegExpExecArray | null;
    while ((entityMatch = ENTITY_REGEX.exec(source)) !== null) {
      const entityArgs = entityMatch[1] ?? "";
      const className = entityMatch[2] ?? "";
      const body = entityMatch[3] ?? "";
      if (!className) {
        continue;
      }

      const tableName = extractTableName(entityArgs, className);
      const columns: NormalizedTableDefinition["columns"] = [];
      const primaryKeys: string[] = [];
      const indexes: NormalizedTableDefinition["indexes"] = [];
      const foreignKeys: NormalizedTableDefinition["foreignKeys"] = [];

      COLUMN_DECORATOR_REGEX.lastIndex = 0;
      let columnMatch: RegExpExecArray | null;
      while ((columnMatch = COLUMN_DECORATOR_REGEX.exec(body)) !== null) {
        const decorator = columnMatch[1] ?? "";
        const decoratorArgs = columnMatch[2] ?? "";
        const propertyName = columnMatch[3] ?? "";
        const typeAnnotation = columnMatch[4] ?? "";
        if (!propertyName) {
          continue;
        }

        const isPrimaryKey = decorator.startsWith("Primary");
        const isUnique = decoratorArgs.includes("unique") || propertyName.toLowerCase().includes("email");
        const nullable = decoratorArgs.includes("nullable: true");

        columns.push({
          name: propertyName,
          dataType: inferType(typeAnnotation, decoratorArgs),
          nullable,
          defaultValue: undefined,
          isPrimaryKey,
          isUnique
        });

        if (isPrimaryKey) {
          primaryKeys.push(propertyName);
        }
        if (isUnique) {
          indexes.push({ columns: [propertyName], unique: true });
        }
      }

      MANY_TO_ONE_REGEX.lastIndex = 0;
      let relationMatch: RegExpExecArray | null;
      while ((relationMatch = MANY_TO_ONE_REGEX.exec(body)) !== null) {
        const targetType = relationMatch[1] ?? "";
        const joinColumnArgs = relationMatch[2] ?? "";
        const propertyName = relationMatch[3] ?? "";
        if (!targetType || !propertyName) {
          continue;
        }

        const sourceColumn = /name\s*:\s*["'`]([^"'`]+)["'`]/.exec(joinColumnArgs)?.[1] ?? `${propertyName}Id`;
        const targetTable = targetType;
        const targetColumn = "id";

        foreignKeys.push({
          sourceTable: tableName,
          sourceColumn,
          targetTable,
          targetColumn
        });

        relationships.push({
          id: `${tableName}.${sourceColumn}->${targetTable}.${targetColumn}`,
          sourceTable: tableName,
          sourceColumn,
          targetTable,
          targetColumn,
          cardinality: "N:1",
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
        issues: [{ level: "error", message: "No TypeORM entities were detected." }]
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
