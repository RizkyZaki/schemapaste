import type { ParseResult, SqlDialect } from "../types";

export interface SqlParserAdapter {
  parse(sql: string, dialect: SqlDialect): ParseResult;
}
