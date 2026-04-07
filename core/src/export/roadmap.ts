import type { SchemaModel } from "../types";

export interface FutureExportAdapter {
  format: "mermaid" | "dbml" | "reverse-sql" | "laravel-migration" | "prisma";
  export(schema: SchemaModel): string;
}

export class MermaidExportAdapter implements FutureExportAdapter {
  readonly format = "mermaid" as const;

  export(schema: SchemaModel): string {
    const lines: string[] = ["erDiagram"];
    for (const table of schema.tables) {
      lines.push(`  ${table.name.toUpperCase()} {`);
      for (const column of table.columns) {
        lines.push(`    ${column.dataType} ${column.name}`);
      }
      lines.push("  }");
    }
    return lines.join("\n");
  }
}

export class DbmlExportAdapter implements FutureExportAdapter {
  readonly format = "dbml" as const;

  export(schema: SchemaModel): string {
    const blocks = schema.tables.map((table) => {
      const lines = table.columns.map((column) => {
        const flags = [column.isPrimaryKey ? "pk" : "", column.isUnique ? "unique" : ""].filter(Boolean).join(", ");
        return flags ? `  ${column.name} ${column.dataType} [${flags}]` : `  ${column.name} ${column.dataType}`;
      });
      return [`Table ${table.name} {`, ...lines, `}`].join("\n");
    });
    return blocks.join("\n\n");
  }
}

export class ReverseSqlExportAdapter implements FutureExportAdapter {
  readonly format = "reverse-sql" as const;

  export(schema: SchemaModel): string {
    const statements = schema.tables.map((table) => {
      const columnLines = table.columns.map((column) => {
        const parts = [column.name, column.dataType, column.nullable ? "" : "NOT NULL", column.isUnique ? "UNIQUE" : ""]
          .filter((part) => part.length > 0)
          .join(" ");
        return `  ${parts}`;
      });
      return [`CREATE TABLE ${table.name} (`, `${columnLines.join(",\n")}`, `);`].join("\n");
    });
    return statements.join("\n\n");
  }
}

export class LaravelMigrationExportAdapter implements FutureExportAdapter {
  readonly format = "laravel-migration" as const;

  export(schema: SchemaModel): string {
    const classes = schema.tables
      .map((table) => `Schema::create('${table.name}', function (Blueprint $table) {\n    // TODO: map columns\n});`)
      .join("\n\n");
    return `<?php\n\nuse Illuminate\\Database\\Migrations\\Migration;\nuse Illuminate\\Database\\Schema\\Blueprint;\nuse Illuminate\\Support\\Facades\\Schema;\n\n${classes}`;
  }
}

export class PrismaExportAdapter implements FutureExportAdapter {
  readonly format = "prisma" as const;

  export(schema: SchemaModel): string {
    const models = schema.tables
      .map((table) => {
        const fields = table.columns.map((column) => `  ${column.name} String`).join("\n");
        return `model ${table.name} {\n${fields}\n}`;
      })
      .join("\n\n");
    return models;
  }
}
