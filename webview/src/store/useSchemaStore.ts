import {
  applyAutoLayout,
  deserializeSchemaSnapshot,
  NodeSqlParserAdapter,
  schemaToGraph,
  type ErdGraph,
  type ParseError,
  type SchemaModel,
  type SqlDialect
} from "@schemapaste/core";
import { create } from "zustand";
import { SAMPLE_SQL } from "../utils/sampleSql";

export type SchemaSourceType = "sql" | "laravel" | "prisma" | "drizzle" | "typeorm" | "sequelize" | "django";

export interface SchemaParseIssue {
  level: "error" | "warning";
  message: string;
  line?: number;
  column?: number;
}

interface SchemaState {
  sql: string;
  dialect: SqlDialect;
  sourceType: SchemaSourceType;
  schema: SchemaModel;
  graph: ErdGraph;
  errors: ParseError[];
  parserIssues: SchemaParseIssue[];
  isParsing: boolean;
  toast: string | null;
  setSql: (sql: string) => void;
  setDialect: (dialect: SqlDialect) => void;
  setSourceType: (sourceType: SchemaSourceType) => void;
  parseSql: (sql: string, dialect?: SqlDialect) => void;
  setParsedGraph: (graph: ErdGraph, parserIssues: SchemaParseIssue[]) => void;
  setFromSnapshot: (raw: string) => void;
  setToast: (value: string | null) => void;
}

const adapter = new NodeSqlParserAdapter();
const initialResult = adapter.parse(SAMPLE_SQL, "mysql");
const initialSchema =
  initialResult.schema ??
  ({
    dialect: "mysql",
    tables: []
  } satisfies SchemaModel);

const initialGraph = applyAutoLayout(schemaToGraph(initialSchema));

export const useSchemaStore = create<SchemaState>((set, get) => ({
  sql: SAMPLE_SQL,
  dialect: "mysql",
  sourceType: "sql",
  schema: initialSchema,
  graph: initialGraph,
  errors: initialResult.errors,
  parserIssues: [],
  isParsing: false,
  toast: null,
  setSql: (sql) => {
    set({ sql });
  },
  setDialect: (dialect) => {
    set({ dialect });
    if (get().sourceType === "sql") {
      get().parseSql(get().sql, dialect);
    }
  },
  setSourceType: (sourceType) => {
    set({ sourceType });
    if (sourceType === "sql") {
      get().parseSql(get().sql, get().dialect);
    } else {
      set({
        errors: []
      });
    }
  },
  parseSql: (sql, dialectOverride) => {
    if (get().sourceType !== "sql") {
      return;
    }

    const dialect = dialectOverride ?? get().dialect;
    set({ isParsing: true });
    const result = adapter.parse(sql, dialect);
    if (result.schema) {
      const graph = applyAutoLayout(schemaToGraph(result.schema));
      set({
        schema: result.schema,
        graph,
        errors: result.errors,
        isParsing: false
      });
      return;
    }
    set({
      errors: result.errors,
      isParsing: false
    });
  },
  setParsedGraph: (graph, parserIssues) => {
    set({
      graph,
      parserIssues
    });
  },
  setFromSnapshot: (raw) => {
    const snapshot = deserializeSchemaSnapshot(raw);
    const graph = applyAutoLayout(schemaToGraph(snapshot.schema));
    set({
      sql: snapshot.sql,
      schema: snapshot.schema,
      dialect: snapshot.schema.dialect,
      graph,
      errors: [],
      sourceType: "sql",
      parserIssues: []
    });
  },
  setToast: (value) => set({ toast: value })
}));
