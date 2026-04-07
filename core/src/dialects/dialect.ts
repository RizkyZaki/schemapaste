import type { SqlDialect } from "../types";

export const SUPPORTED_DIALECTS: SqlDialect[] = ["mysql", "postgresql", "sqlite"];

export function toNodeSqlParserDialect(dialect: SqlDialect): "MySQL" | "Postgresql" | "sqlite" {
  switch (dialect) {
    case "mysql":
      return "MySQL";
    case "postgresql":
      return "Postgresql";
    case "sqlite":
      return "sqlite";
  }
}
