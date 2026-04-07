import type { SchemaModel, SchemaSnapshot } from "../types";

export function serializeSchemaSnapshot(schema: SchemaModel, sql: string): string {
  const snapshot: SchemaSnapshot = {
    version: 1,
    createdAt: new Date().toISOString(),
    sql,
    schema
  };
  return JSON.stringify(snapshot, null, 2);
}

export function deserializeSchemaSnapshot(raw: string): SchemaSnapshot {
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid schema JSON: expected object");
  }

  const snapshot = parsed as Partial<SchemaSnapshot>;
  if (snapshot.version !== 1) {
    throw new Error("Unsupported snapshot version");
  }

  if (typeof snapshot.createdAt !== "string" || typeof snapshot.sql !== "string" || !snapshot.schema) {
    throw new Error("Invalid schema JSON: missing required fields");
  }

  return snapshot as SchemaSnapshot;
}
