import type { ColumnDefinition, ErdEdge, ErdGraph, ErdNode } from "@schemapaste/core";
import type { NormalizedSchemaModel } from "../types/normalizedSchema";

function toColumns(schema: NormalizedSchemaModel, tableName: string): ColumnDefinition[] {
  const foreignKeyColumns = new Set(
    schema.relationships
      .filter((relationship) => relationship.sourceTable === tableName)
      .map((relationship) => relationship.sourceColumn)
  );

  const table = schema.tables.find((item) => item.name === tableName);
  if (!table) {
    return [];
  }

  return table.columns.map((column) => ({
    name: column.name,
    dataType: column.dataType,
    nullable: column.nullable,
    isPrimaryKey: column.isPrimaryKey,
    isUnique: column.isUnique,
    isForeignKey: foreignKeyColumns.has(column.name)
  }));
}

export function normalizedSchemaToGraph(schema: NormalizedSchemaModel): ErdGraph {
  const nodes: ErdNode[] = schema.tables.map((table, index) => ({
    id: table.name,
    type: "tableNode",
    data: {
      tableName: table.name,
      columns: toColumns(schema, table.name)
    },
    position: {
      x: index * 180,
      y: index * 100
    }
  }));

  const edges: ErdEdge[] = schema.relationships.map((relationship, index) => ({
    id: relationship.id || `${relationship.sourceTable}-${relationship.sourceColumn}-${relationship.targetTable}-${index}`,
    source: relationship.sourceTable,
    target: relationship.targetTable,
    label: relationship.label ?? `${relationship.sourceColumn} -> ${relationship.targetColumn}`,
    animated: relationship.line.highlighted
  }));

  return {
    nodes,
    edges
  };
}
