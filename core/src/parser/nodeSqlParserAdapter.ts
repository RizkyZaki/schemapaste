import { Parser } from "node-sql-parser";
import { toNodeSqlParserDialect } from "../dialects/dialect";
import type {
  ColumnDefinition,
  ForeignKeyDefinition,
  ParseError,
  ParseResult,
  SchemaModel,
  SqlDialect,
  TableDefinition
} from "../types";
import type { SqlParserAdapter } from "./sqlParserAdapter";

interface CreateDefinitionNode {
  resource?: string;
  column?: unknown;
  constraint_type?: string;
  definition?: unknown;
  reference_definition?: {
    table?: unknown;
    definition?: unknown;
  };
  keyword?: string;
  primary_key?: string;
  unique?: string;
  nullable?: {
    value?: string;
  };
}

interface CreateTableStatement {
  type?: string;
  keyword?: string;
  table?: unknown;
  create_definitions?: unknown[];
}

function getName(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const maybeName = value as { table?: unknown; column?: unknown; value?: unknown; expr?: unknown };
    if (typeof maybeName.table === "string") {
      return maybeName.table;
    }
    if (typeof maybeName.column === "string") {
      return maybeName.column;
    }
    if (typeof maybeName.value === "string") {
      return maybeName.value;
    }
    if (maybeName.expr) {
      return getName(maybeName.expr);
    }
  }

  return "";
}

function extractIdentifierList(definition: unknown): string[] {
  if (!Array.isArray(definition)) {
    return [];
  }

  return definition
    .map((entry) => getName(entry).trim())
    .filter((entry) => entry.length > 0);
}

function extractDataType(definition: unknown): string {
  if (!definition || typeof definition !== "object") {
    return "unknown";
  }

  const def = definition as { dataType?: unknown; datatype?: unknown; length?: unknown[] };
  const typeName = typeof def.dataType === "string" ? def.dataType : typeof def.datatype === "string" ? def.datatype : "unknown";
  const len = Array.isArray(def.length) ? def.length.map((item) => String(item)).join(",") : "";
  return len ? `${typeName}(${len})` : typeName;
}

function isNullable(definition: unknown, node: CreateDefinitionNode): boolean {
  const notNullFromNode = node.nullable?.value?.toLowerCase().includes("not");
  if (typeof notNullFromNode === "boolean") {
    return !notNullFromNode;
  }

  if (!definition || typeof definition !== "object") {
    return true;
  }

  const def = definition as { nullable?: { value?: string } };
  const value = def.nullable?.value?.toLowerCase() ?? "";
  return !value.includes("not");
}

function tableNameFromNode(tableNode: unknown): string {
  if (Array.isArray(tableNode) && tableNode.length > 0) {
    return getName(tableNode[0]);
  }
  return getName(tableNode);
}

function parseCreateTable(statement: CreateTableStatement): TableDefinition | null {
  const tableName = tableNameFromNode(statement.table);
  if (!tableName) {
    return null;
  }

  const columns: ColumnDefinition[] = [];
  const primaryKeys = new Set<string>();
  const uniqueKeys = new Set<string>();
  const foreignKeys: ForeignKeyDefinition[] = [];

  const defs = Array.isArray(statement.create_definitions) ? statement.create_definitions : [];

  for (const defNode of defs) {
    const node = (defNode ?? {}) as CreateDefinitionNode;

    if (node.resource === "column" || node.resource === "column_ref") {
      const columnName = getName(node.column).trim();
      if (!columnName) {
        continue;
      }

      const isPk = (node.primary_key ?? "").toLowerCase().includes("primary");
      const isUniqueColumn = (node.unique ?? "").toLowerCase().includes("unique");
      if (isPk) {
        primaryKeys.add(columnName);
      }
      if (isUniqueColumn) {
        uniqueKeys.add(columnName);
      }

      let foreignRef: { table: string; column: string } | null = null;
      if (node.reference_definition) {
        const targetTable = tableNameFromNode(node.reference_definition.table);
        const targetColumns = extractIdentifierList(node.reference_definition.definition);
        const firstTargetColumn = targetColumns[0];
        if (targetTable && firstTargetColumn) {
          foreignRef = { table: targetTable, column: firstTargetColumn };
        }
      }

      columns.push({
        name: columnName,
        dataType: extractDataType(node.definition),
        nullable: isNullable(node.definition, node),
        isPrimaryKey: isPk,
        isForeignKey: foreignRef !== null,
        isUnique: isUniqueColumn
      });

      if (foreignRef) {
        foreignKeys.push({
          sourceTable: tableName,
          sourceColumn: columnName,
          targetTable: foreignRef.table,
          targetColumn: foreignRef.column
        });
      }

      continue;
    }

    if (node.resource === "constraint" || node.keyword === "constraint") {
      const constraintType = (node.constraint_type ?? "").toLowerCase();
      const sourceColumns = extractIdentifierList(node.definition);

      if (constraintType.includes("primary")) {
        sourceColumns.forEach((name) => primaryKeys.add(name));
      }

      if (constraintType.includes("unique")) {
        sourceColumns.forEach((name) => uniqueKeys.add(name));
      }

      if (constraintType.includes("foreign")) {
        const targetTable = tableNameFromNode(node.reference_definition?.table);
        const targetColumns = extractIdentifierList(node.reference_definition?.definition);
        if (targetTable && sourceColumns.length > 0 && targetColumns.length > 0) {
          const length = Math.min(sourceColumns.length, targetColumns.length);
          for (let index = 0; index < length; index += 1) {
            const sourceColumn = sourceColumns[index];
            const targetColumn = targetColumns[index];
            if (!sourceColumn || !targetColumn) {
              continue;
            }
            foreignKeys.push({
              sourceTable: tableName,
              sourceColumn,
              targetTable,
              targetColumn
            });
          }
        }
      }
    }
  }

  const updatedColumns = columns.map((column) => ({
    ...column,
    isPrimaryKey: column.isPrimaryKey || primaryKeys.has(column.name),
    isUnique: column.isUnique || uniqueKeys.has(column.name),
    isForeignKey: column.isForeignKey || foreignKeys.some((key) => key.sourceColumn === column.name)
  }));

  return {
    name: tableName,
    columns: updatedColumns,
    primaryKeys: [...primaryKeys],
    uniqueKeys: [...uniqueKeys],
    foreignKeys
  };
}

function normalizeStatements(parsedAst: unknown): CreateTableStatement[] {
  if (Array.isArray(parsedAst)) {
    return parsedAst as CreateTableStatement[];
  }
  return [parsedAst as CreateTableStatement];
}

function mapError(error: unknown): ParseError {
  if (!error || typeof error !== "object") {
    return { message: "Unknown parse error" };
  }

  const err = error as { message?: unknown; location?: { start?: { line?: unknown; column?: unknown } } };
  const message = typeof err.message === "string" ? err.message : "Unknown parse error";
  const line = typeof err.location?.start?.line === "number" ? err.location.start.line : undefined;
  const column = typeof err.location?.start?.column === "number" ? err.location.start.column : undefined;

  return {
    message,
    position: line && column ? { line, column } : undefined
  };
}

export class NodeSqlParserAdapter implements SqlParserAdapter {
  private readonly parser = new Parser();

  parse(sql: string, dialect: SqlDialect): ParseResult {
    const trimmed = sql.trim();
    if (!trimmed) {
      return {
        schema: {
          dialect,
          tables: []
        },
        errors: []
      };
    }

    try {
      const ast = this.parser.astify(trimmed, {
        database: toNodeSqlParserDialect(dialect)
      }) as unknown;

      const statements = normalizeStatements(ast);
      const tables = statements
        .filter((statement) => statement.type === "create" && statement.keyword === "table")
        .map((statement) => parseCreateTable(statement))
        .filter((table): table is TableDefinition => table !== null);

      const schema: SchemaModel = {
        dialect,
        tables
      };

      return {
        schema,
        errors: []
      };
    } catch (error) {
      return {
        schema: null,
        errors: [mapError(error)]
      };
    }
  }
}
