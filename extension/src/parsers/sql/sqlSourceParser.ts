import { NodeSqlParserAdapter } from "@schemapaste/core";
import type {
  NormalizedRelationshipDefinition,
  NormalizedSchemaModel,
  NormalizedTableDefinition,
  SchemaParseResult
} from "../../types/normalizedSchema";
import type { SchemaParserAdapter } from "../registry/types";

function toRelationshipId(
  sourceTable: string,
  sourceColumn: string,
  targetTable: string,
  targetColumn: string
): string {
  return `${sourceTable}.${sourceColumn}->${targetTable}.${targetColumn}`;
}

export class SqlSourceParser implements SchemaParserAdapter {
  readonly sourceType = "sql" as const;

  private readonly adapter = new NodeSqlParserAdapter();

  parse(source: string): SchemaParseResult {
    const parsed = this.adapter.parse(source, "mysql");

    if (!parsed.schema) {
      return {
        schema: null,
        issues: parsed.errors.map((error) => ({
          level: "error" as const,
          message: error.message,
          line: error.position?.line,
          column: error.position?.column
        }))
      };
    }

    const tables: NormalizedTableDefinition[] = parsed.schema.tables.map((table) => ({
      name: table.name,
      columns: table.columns.map((column) => ({
        name: column.name,
        dataType: column.dataType,
        nullable: column.nullable,
        isPrimaryKey: column.isPrimaryKey,
        isUnique: column.isUnique,
        defaultValue: undefined
      })),
      primaryKeys: table.primaryKeys,
      indexes: table.uniqueKeys.map((columnName) => ({
        columns: [columnName],
        unique: true
      })),
      foreignKeys: table.foreignKeys.map((key) => ({
        name: key.name,
        sourceTable: key.sourceTable,
        sourceColumn: key.sourceColumn,
        targetTable: key.targetTable,
        targetColumn: key.targetColumn
      }))
    }));

    const relationships: NormalizedRelationshipDefinition[] = tables.flatMap((table) =>
      table.foreignKeys.map((key) => ({
        id: toRelationshipId(key.sourceTable, key.sourceColumn, key.targetTable, key.targetColumn),
        sourceTable: key.sourceTable,
        sourceColumn: key.sourceColumn,
        targetTable: key.targetTable,
        targetColumn: key.targetColumn,
        cardinality: "N:1" as const,
        label: `${key.sourceColumn} -> ${key.targetColumn}`,
        line: {
          style: "smooth" as const,
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
      issues: []
    };
  }
}
