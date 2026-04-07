import type { ErdEdge, ErdGraph, ErdNode, SchemaModel } from "../types";

export function schemaToGraph(schema: SchemaModel): ErdGraph {
  const nodes: ErdNode[] = schema.tables.map((table, index) => ({
    id: table.name,
    type: "tableNode",
    data: {
      tableName: table.name,
      columns: table.columns
    },
    position: {
      x: index * 180,
      y: index * 100
    }
  }));

  const edges: ErdEdge[] = schema.tables.flatMap((table) =>
    table.foreignKeys.map((foreignKey, index) => ({
      id: `${table.name}-${foreignKey.sourceColumn}-${foreignKey.targetTable}-${index}`,
      source: foreignKey.sourceTable,
      target: foreignKey.targetTable,
      label: `${foreignKey.sourceColumn} -> ${foreignKey.targetColumn}`,
      animated: false
    }))
  );

  return {
    nodes,
    edges
  };
}
