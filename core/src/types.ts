export type SqlDialect = "mysql" | "postgresql" | "sqlite";

export interface ColumnDefinition {
  name: string;
  dataType: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
}

export interface ForeignKeyDefinition {
  name?: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  primaryKeys: string[];
  uniqueKeys: string[];
  foreignKeys: ForeignKeyDefinition[];
}

export interface SchemaModel {
  dialect: SqlDialect;
  tables: TableDefinition[];
}

export interface ParseError {
  message: string;
  position?: {
    line: number;
    column: number;
  };
}

export interface ParseResult {
  schema: SchemaModel | null;
  errors: ParseError[];
}

export interface ErdNodeData {
  tableName: string;
  columns: ColumnDefinition[];
}

export interface ErdNode {
  id: string;
  type: string;
  data: ErdNodeData;
  position: {
    x: number;
    y: number;
  };
}

export interface ErdEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  sourceHandle?: string;
  targetHandle?: string;
  animated?: boolean;
}

export interface ErdGraph {
  nodes: ErdNode[];
  edges: ErdEdge[];
}

export interface SchemaSnapshot {
  version: 1;
  createdAt: string;
  sql: string;
  schema: SchemaModel;
}
