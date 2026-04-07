import type { SchemaParseResult, SchemaSourceType } from "../../types/normalizedSchema";
import type { SchemaParserAdapter } from "./types";

export class UnsupportedSchemaParser implements SchemaParserAdapter {
  constructor(public readonly sourceType: SchemaSourceType) {}

  parse(_source: string): SchemaParseResult {
    return {
      schema: null,
      issues: [
        {
          level: "error",
          message: `Parser for '${this.sourceType}' is not implemented yet. Register a parser plugin to enable it.`
        }
      ]
    };
  }
}
