import type { ErdWorkspaceRecord } from "../../types/normalizedSchema";

function tableToSql(workspace: ErdWorkspaceRecord): string {
  const chunks = workspace.normalizedSchema.tables.map((table) => {
    const columns = table.columns.map((column) => {
      const nullable = column.nullable ? "" : " NOT NULL";
      const unique = column.isUnique ? " UNIQUE" : "";
      return `  ${column.name} ${column.dataType}${nullable}${unique}`;
    });

    const pk = table.primaryKeys.length > 0 ? `  PRIMARY KEY (${table.primaryKeys.join(", ")})` : "";
    const fks = table.foreignKeys.map(
      (key) =>
        `  FOREIGN KEY (${key.sourceColumn}) REFERENCES ${key.targetTable}(${key.targetColumn})`
    );

    return [
      `CREATE TABLE ${table.name} (`,
      [...columns, pk, ...fks].filter(Boolean).join(",\n"),
      ");"
    ].join("\n");
  });

  return `${chunks.join("\n\n")}\n`;
}

function tableToLaravel(workspace: ErdWorkspaceRecord): string {
  const chunks = workspace.normalizedSchema.tables.map((table) => {
    const lines = table.columns.map((column) => {
      if (column.isPrimaryKey && column.name === "id") {
        return "            $table->id();";
      }

      const nullable = column.nullable ? "->nullable()" : "";
      return `            $table->string('${column.name}')${nullable};`;
    });

    const fkLines = table.foreignKeys.map(
      (key) =>
        `            $table->foreign('${key.sourceColumn}')->references('${key.targetColumn}')->on('${key.targetTable}');`
    );

    return [
      `Schema::create('${table.name}', function (Blueprint $table) {`,
      ...lines,
      ...fkLines,
      "        });"
    ].join("\n");
  });

  return `${chunks.join("\n\n")}\n`;
}

function tableToPrisma(workspace: ErdWorkspaceRecord): string {
  const chunks = workspace.normalizedSchema.tables.map((table) => {
    const lines = table.columns.map((column) => {
      const prismaType = column.dataType.includes("int") ? "Int" : column.dataType.includes("bool") ? "Boolean" : "String";
      const optional = column.nullable ? "?" : "";
      const attrs = [column.isPrimaryKey ? "@id" : "", column.isUnique ? "@unique" : ""].filter(Boolean).join(" ");
      return `  ${column.name} ${prismaType}${optional} ${attrs}`.trimEnd();
    });

    return [`model ${table.name} {`, ...lines, "}"].join("\n");
  });

  return `${chunks.join("\n\n")}\n`;
}

function tableToDrizzle(workspace: ErdWorkspaceRecord): string {
  const chunks = workspace.normalizedSchema.tables.map((table) => {
    const lines = table.columns.map((column) => {
      const builder = column.dataType.includes("int") ? "integer" : "varchar";
      const pk = column.isPrimaryKey ? ".primaryKey()" : "";
      const nullable = column.nullable ? "" : ".notNull()";
      return `  ${column.name}: ${builder}('${column.name}')${nullable}${pk},`;
    });

    return [
      `export const ${table.name} = pgTable('${table.name}', {`,
      ...lines,
      "});"
    ].join("\n");
  });

  return `${chunks.join("\n\n")}\n`;
}

function tableToTypeOrm(workspace: ErdWorkspaceRecord): string {
  const chunks = workspace.normalizedSchema.tables.map((table) => {
    const className = `${table.name.charAt(0).toUpperCase()}${table.name.slice(1)}`;
    const lines = table.columns.map((column) => {
      if (column.isPrimaryKey && column.name === "id") {
        return `  @PrimaryGeneratedColumn()\n  id: number;`;
      }

      const nullable = column.nullable ? ", nullable: true" : "";
      return `  @Column({ type: '${column.dataType}'${nullable} })\n  ${column.name}: string;`;
    });

    return ["@Entity()", `export class ${className} {`, ...lines, "}"].join("\n");
  });

  return `${chunks.join("\n\n")}\n`;
}

function tableToSequelize(workspace: ErdWorkspaceRecord): string {
  const chunks = workspace.normalizedSchema.tables.map((table) => {
    const lines = table.columns.map((column) => {
      const type = column.dataType.includes("int") ? "DataTypes.INTEGER" : "DataTypes.STRING";
      const allowNull = column.nullable ? "true" : "false";
      const primary = column.isPrimaryKey ? ", primaryKey: true" : "";
      return `  ${column.name}: { type: ${type}, allowNull: ${allowNull}${primary} },`;
    });

    return [`sequelize.define('${table.name}', {`, ...lines, "});"].join("\n");
  });

  return `${chunks.join("\n\n")}\n`;
}

function tableToDjango(workspace: ErdWorkspaceRecord): string {
  const chunks = workspace.normalizedSchema.tables.map((table) => {
    const className = `${table.name.charAt(0).toUpperCase()}${table.name.slice(1)}`;
    const lines = table.columns.map((column) => {
      if (column.isPrimaryKey && column.name === "id") {
        return "    id = models.AutoField(primary_key=True)";
      }

      const nullable = column.nullable ? ", null=True, blank=True" : "";
      return `    ${column.name} = models.CharField(max_length=255${nullable})`;
    });

    return [`class ${className}(models.Model):`, ...lines].join("\n");
  });

  return `${chunks.join("\n\n")}\n`;
}

export function renderSourceByFormat(workspace: ErdWorkspaceRecord, format: string): string {
  switch (format) {
    case "sql":
      return tableToSql(workspace);
    case "laravel":
      return tableToLaravel(workspace);
    case "prisma":
      return tableToPrisma(workspace);
    case "drizzle":
      return tableToDrizzle(workspace);
    case "typeorm":
      return tableToTypeOrm(workspace);
    case "sequelize":
      return tableToSequelize(workspace);
    case "django":
      return tableToDjango(workspace);
    default:
      return tableToSql(workspace);
  }
}

export function renderSchemaSvg(workspace: ErdWorkspaceRecord): string {
  const boxWidth = 260;
  const boxHeight = 160;
  const gap = 30;
  const cols = 3;
  const rows = Math.max(1, Math.ceil(workspace.normalizedSchema.tables.length / cols));
  const width = cols * (boxWidth + gap) + gap;
  const height = rows * (boxHeight + gap) + gap;

  const boxes = workspace.normalizedSchema.tables
    .map((table, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = gap + col * (boxWidth + gap);
      const y = gap + row * (boxHeight + gap);
      const title = `<text x='${x + 12}' y='${y + 24}' font-size='14' fill='#E5E7EB' font-family='monospace'>${table.name}</text>`;
      const body = table.columns
        .slice(0, 8)
        .map(
          (column, offset) =>
            `<text x='${x + 12}' y='${y + 46 + offset * 14}' font-size='11' fill='#9CA3AF' font-family='monospace'>${column.name}: ${column.dataType}</text>`
        )
        .join("");
      return `<rect x='${x}' y='${y}' width='${boxWidth}' height='${boxHeight}' rx='10' fill='#111827' stroke='#334155'/>${title}${body}`;
    })
    .join("");

  return `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><rect width='100%' height='100%' fill='#0B1220'/>${boxes}</svg>`;
}

export function renderSimplePdf(textLines: string[]): Uint8Array {
  const sanitized = textLines.map((line) => line.replace(/([()\\])/g, "\\$1"));
  const content = [
    "BT",
    "/F1 11 Tf",
    "50 780 Td",
    ...sanitized.map((line, index) => `${index === 0 ? "" : "0 -14 Td"}(${line}) Tj`.trim()),
    "ET"
  ].join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`
  ];

  let offset = 9;
  const bodyParts: string[] = [];
  const xref: number[] = [0];
  for (const object of objects) {
    xref.push(offset);
    bodyParts.push(object);
    offset += object.length + 1;
  }

  const xrefStart = offset;
  const xrefRows = ["0000000000 65535 f ", ...xref.slice(1).map((value) => `${value.toString().padStart(10, "0")} 00000 n `)].join("\n");
  const trailer = `xref\n0 ${objects.length + 1}\n${xrefRows}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const pdf = `%PDF-1.4\n${bodyParts.join("\n")}\n${trailer}`;
  return new TextEncoder().encode(pdf);
}
