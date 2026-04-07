import type { SchemaSourceType } from "../../types/normalizedSchema";
import type { SchemaParserAdapter } from "./types";

export class SchemaParserRegistry {
  private readonly adapters = new Map<SchemaSourceType, SchemaParserAdapter>();

  register(adapter: SchemaParserAdapter): void {
    this.adapters.set(adapter.sourceType, adapter);
  }

  resolve(sourceType: SchemaSourceType): SchemaParserAdapter {
    const adapter = this.adapters.get(sourceType);
    if (!adapter) {
      throw new Error(`No parser adapter is registered for source type: ${sourceType}`);
    }
    return adapter;
  }

  list(): SchemaParserAdapter[] {
    return [...this.adapters.values()];
  }
}
