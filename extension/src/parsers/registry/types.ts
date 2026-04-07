import type { SchemaParseResult, SchemaSourceType } from "../../types/normalizedSchema";

export interface SchemaParserAdapter {
  readonly sourceType: SchemaSourceType;
  parse(source: string): SchemaParseResult;
}
