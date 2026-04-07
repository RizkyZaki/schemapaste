import type { ColumnDefinition, SchemaModel, TableDefinition } from "../types";

export type BackendMigrationTarget = "laravel" | "prisma" | "knex" | "sequelize" | "typeorm";

type ColumnKind =
  | "string"
  | "text"
  | "integer"
  | "bigInteger"
  | "smallInteger"
  | "boolean"
  | "date"
  | "dateTime"
  | "timestamp"
  | "time"
  | "decimal"
  | "float"
  | "json"
  | "uuid"
  | "binary";

export function generateBackendMigration(schema: SchemaModel, target: BackendMigrationTarget): string {
  switch (target) {
    case "laravel":
      return generateLaravelMigration(schema);
    case "prisma":
      return generatePrismaSchema(schema);
    case "knex":
      return generateKnexMigration(schema);
    case "sequelize":
      return generateSequelizeMigration(schema);
    case "typeorm":
      return generateTypeOrmMigration(schema);
    default:
      return "";
  }
}

function generateLaravelMigration(schema: SchemaModel): string {
  const tableBlocks = schema.tables
    .map((table) => {
      const columnLines = table.columns.map((column) => `            ${toLaravelColumnLine(column)}`).join("\n");
      const foreignKeyLines = table.foreignKeys
        .map(
          (foreignKey) =>
            `            $table->foreign('${foreignKey.sourceColumn}')->references('${foreignKey.targetColumn}')->on('${foreignKey.targetTable}');`
        )
        .join("\n");
      const primaryLine =
        table.primaryKeys.length > 1
          ? `            $table->primary([${table.primaryKeys.map((key) => `'${key}'`).join(", ")}]);`
          : "";

      const lines = [
        `        Schema::create('${table.name}', function (Blueprint $table) {`,
        columnLines,
        primaryLine,
        foreignKeyLines,
        "        });"
      ].filter((line) => line.length > 0);

      return lines.join("\n");
    })
    .join("\n\n");

  const dropBlocks = [...schema.tables]
    .reverse()
    .map((table) => `        Schema::dropIfExists('${table.name}');`)
    .join("\n");

  return `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
${tableBlocks}
    }

    public function down(): void
    {
${dropBlocks}
    }
};`;
}

function toLaravelColumnLine(column: ColumnDefinition): string {
  const kind = resolveColumnKind(column.dataType);
  const method = (() => {
    switch (kind) {
      case "string":
        return `string('${column.name}')`;
      case "text":
        return `text('${column.name}')`;
      case "integer":
        return `integer('${column.name}')`;
      case "bigInteger":
        return `bigInteger('${column.name}')`;
      case "smallInteger":
        return `smallInteger('${column.name}')`;
      case "boolean":
        return `boolean('${column.name}')`;
      case "date":
        return `date('${column.name}')`;
      case "dateTime":
        return `dateTime('${column.name}')`;
      case "timestamp":
        return `timestamp('${column.name}')`;
      case "time":
        return `time('${column.name}')`;
      case "decimal":
        return `decimal('${column.name}', 10, 2)`;
      case "float":
        return `float('${column.name}')`;
      case "json":
        return `json('${column.name}')`;
      case "uuid":
        return `uuid('${column.name}')`;
      case "binary":
        return `binary('${column.name}')`;
      default:
        return `string('${column.name}')`;
    }
  })();

  const modifiers: string[] = [];
  if (column.nullable) {
    modifiers.push("nullable()");
  }
  if (column.isUnique) {
    modifiers.push("unique()");
  }
  if (column.isPrimaryKey) {
    modifiers.push("primary()");
  }

  const suffix = modifiers.length > 0 ? `->${modifiers.join("->")}` : "";
  return `$table->${method}${suffix};`;
}

function generatePrismaSchema(schema: SchemaModel): string {
  const models = schema.tables
    .map((table) => {
      const lines = table.columns.map((column) => {
        const prismaType = toPrismaType(column.dataType);
        const fieldName = toPrismaFieldName(column.name);
        const attributes: string[] = [];

        if (column.isPrimaryKey) {
          attributes.push("@id");
          if (isAutoIncrementCandidate(column)) {
            attributes.push("@default(autoincrement())");
          }
        }

        if (column.isUnique) {
          attributes.push("@unique");
        }

        if (fieldName !== column.name) {
          attributes.push(`@map(\"${column.name}\")`);
        }

        const nullableSuffix = column.nullable ? "?" : "";
        return `  ${fieldName} ${prismaType}${nullableSuffix}${attributes.length > 0 ? ` ${attributes.join(" ")}` : ""}`;
      });

      const tableMap = table.name !== toPrismaModelName(table.name) ? `\n\n  @@map(\"${table.name}\")` : "";
      return `model ${toPrismaModelName(table.name)} {\n${lines.join("\n")}${tableMap}\n}`;
    })
    .join("\n\n");

  return `generator client {
  provider = \"prisma-client-js\"
}

datasource db {
  provider = \"postgresql\"
  url      = env(\"DATABASE_URL\")
}

${models}`;
}

function generateKnexMigration(schema: SchemaModel): string {
  const upBlocks = schema.tables
    .map((table) => {
      const lines = table.columns.map((column) => `      ${toKnexColumnLine(column)}`).join("\n");
      const fks = table.foreignKeys
        .map(
          (foreignKey) =>
            `      table.foreign('${foreignKey.sourceColumn}').references('${foreignKey.targetColumn}').inTable('${foreignKey.targetTable}');`
        )
        .join("\n");

      return [
        `  await knex.schema.createTable('${table.name}', (table) => {`,
        lines,
        table.primaryKeys.length > 1
          ? `      table.primary([${table.primaryKeys.map((key) => `'${key}'`).join(", ")}]);`
          : "",
        fks,
        "  });"
      ]
        .filter((line) => line.length > 0)
        .join("\n");
    })
    .join("\n\n");

  const downBlocks = [...schema.tables]
    .reverse()
    .map((table) => `  await knex.schema.dropTableIfExists('${table.name}');`)
    .join("\n");

  return `import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
${upBlocks}
}

export async function down(knex: Knex): Promise<void> {
${downBlocks}
}`;
}

function toKnexColumnLine(column: ColumnDefinition): string {
  const kind = resolveColumnKind(column.dataType);
  const method = (() => {
    switch (kind) {
      case "text":
        return `table.text('${column.name}')`;
      case "integer":
        return `table.integer('${column.name}')`;
      case "bigInteger":
        return `table.bigInteger('${column.name}')`;
      case "smallInteger":
        return `table.smallint('${column.name}')`;
      case "boolean":
        return `table.boolean('${column.name}')`;
      case "date":
        return `table.date('${column.name}')`;
      case "dateTime":
        return `table.dateTime('${column.name}')`;
      case "timestamp":
        return `table.timestamp('${column.name}')`;
      case "time":
        return `table.time('${column.name}')`;
      case "decimal":
        return `table.decimal('${column.name}', 10, 2)`;
      case "float":
        return `table.float('${column.name}')`;
      case "json":
        return `table.json('${column.name}')`;
      case "uuid":
        return `table.uuid('${column.name}')`;
      case "binary":
        return `table.binary('${column.name}')`;
      default:
        return `table.string('${column.name}')`;
    }
  })();

  const modifiers: string[] = [];
  if (!column.nullable) {
    modifiers.push("notNullable()");
  }
  if (column.isUnique) {
    modifiers.push("unique()");
  }
  if (column.isPrimaryKey) {
    modifiers.push("primary()");
  }

  const suffix = modifiers.length > 0 ? `.${modifiers.join(".")}` : "";
  return `${method}${suffix};`;
}

function generateSequelizeMigration(schema: SchemaModel): string {
  const tableBlocks = schema.tables
    .map((table) => {
      const fields = table.columns.map((column) => `      ${toSequelizeField(column)}`).join(",\n");
      return `    await queryInterface.createTable('${table.name}', {\n${fields}\n    });`;
    })
    .join("\n\n");

  const downBlocks = [...schema.tables]
    .reverse()
    .map((table) => `    await queryInterface.dropTable('${table.name}');`)
    .join("\n");

  return `"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
${tableBlocks}
  },

  async down(queryInterface, Sequelize) {
${downBlocks}
  }
};`;
}

function toSequelizeField(column: ColumnDefinition): string {
  const type = (() => {
    switch (resolveColumnKind(column.dataType)) {
      case "text":
        return "Sequelize.TEXT";
      case "integer":
        return "Sequelize.INTEGER";
      case "bigInteger":
        return "Sequelize.BIGINT";
      case "smallInteger":
        return "Sequelize.SMALLINT";
      case "boolean":
        return "Sequelize.BOOLEAN";
      case "date":
        return "Sequelize.DATEONLY";
      case "dateTime":
      case "timestamp":
        return "Sequelize.DATE";
      case "time":
        return "Sequelize.TIME";
      case "decimal":
        return "Sequelize.DECIMAL(10, 2)";
      case "float":
        return "Sequelize.FLOAT";
      case "json":
        return "Sequelize.JSON";
      case "uuid":
        return "Sequelize.UUID";
      case "binary":
        return "Sequelize.BLOB";
      default:
        return "Sequelize.STRING";
    }
  })();

  return `'${column.name}': { type: ${type}, allowNull: ${column.nullable ? "true" : "false"}, unique: ${column.isUnique ? "true" : "false"}, primaryKey: ${column.isPrimaryKey ? "true" : "false"} }`;
}

function generateTypeOrmMigration(schema: SchemaModel): string {
  const tableBlocks = schema.tables
    .map((table) => {
      const columns = table.columns
        .map((column) => {
          const columnType = toTypeOrmType(column.dataType);
          return `        { name: '${column.name}', type: '${columnType}', isNullable: ${column.nullable ? "true" : "false"}, isPrimary: ${column.isPrimaryKey ? "true" : "false"}, isUnique: ${column.isUnique ? "true" : "false"} }`;
        })
        .join(",\n");

      const fks = table.foreignKeys
        .map(
          (foreignKey) =>
            `        new TableForeignKey({ columnNames: ['${foreignKey.sourceColumn}'], referencedTableName: '${foreignKey.targetTable}', referencedColumnNames: ['${foreignKey.targetColumn}'] })`
        )
        .join(",\n");

      const fkBlock = fks.length > 0 ? `\n      const ${table.name}ForeignKeys = [\n${fks}\n      ];` : "";
      const fkApply =
        fks.length > 0
          ? `\n      for (const foreignKey of ${table.name}ForeignKeys) {\n        await queryRunner.createForeignKey('${table.name}', foreignKey);\n      }`
          : "";

      return `      await queryRunner.createTable(new Table({
        name: '${table.name}',
        columns: [
${columns}
        ]
      }));${fkBlock}${fkApply}`;
    })
    .join("\n\n");

  const downBlocks = [...schema.tables]
    .reverse()
    .map((table) => `      await queryRunner.dropTable('${table.name}', true);`)
    .join("\n");

  return `import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class InitSchema1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
${tableBlocks}
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
${downBlocks}
  }
}`;
}

function toTypeOrmType(dataType: string): string {
  switch (resolveColumnKind(dataType)) {
    case "text":
      return "text";
    case "integer":
      return "int";
    case "bigInteger":
      return "bigint";
    case "smallInteger":
      return "smallint";
    case "boolean":
      return "boolean";
    case "date":
      return "date";
    case "dateTime":
      return "datetime";
    case "timestamp":
      return "timestamp";
    case "time":
      return "time";
    case "decimal":
      return "decimal";
    case "float":
      return "float";
    case "json":
      return "json";
    case "uuid":
      return "uuid";
    case "binary":
      return "blob";
    default:
      return "varchar";
  }
}

function toPrismaType(dataType: string): string {
  switch (resolveColumnKind(dataType)) {
    case "text":
    case "string":
    case "uuid":
    case "time":
      return "String";
    case "integer":
    case "smallInteger":
      return "Int";
    case "bigInteger":
      return "BigInt";
    case "boolean":
      return "Boolean";
    case "date":
    case "dateTime":
    case "timestamp":
      return "DateTime";
    case "decimal":
      return "Decimal";
    case "float":
      return "Float";
    case "json":
      return "Json";
    case "binary":
      return "Bytes";
    default:
      return "String";
  }
}

function isAutoIncrementCandidate(column: ColumnDefinition): boolean {
  const normalized = normalizeDataType(column.dataType);
  return column.isPrimaryKey && (normalized.includes("int") || normalized.includes("serial"));
}

function resolveColumnKind(dataType: string): ColumnKind {
  const normalized = normalizeDataType(dataType);

  if (normalized.includes("json")) {
    return "json";
  }
  if (normalized.includes("uuid")) {
    return "uuid";
  }
  if (normalized.includes("bool")) {
    return "boolean";
  }
  if (normalized.includes("bigint")) {
    return "bigInteger";
  }
  if (normalized.includes("smallint") || normalized.includes("tinyint")) {
    return "smallInteger";
  }
  if (normalized.includes("int") || normalized.includes("serial")) {
    return "integer";
  }
  if (normalized.includes("decimal") || normalized.includes("numeric")) {
    return "decimal";
  }
  if (normalized.includes("float") || normalized.includes("double") || normalized.includes("real")) {
    return "float";
  }
  if (normalized.includes("timestamp")) {
    return "timestamp";
  }
  if (normalized.includes("datetime")) {
    return "dateTime";
  }
  if (normalized.includes("date")) {
    return "date";
  }
  if (normalized.includes("time")) {
    return "time";
  }
  if (normalized.includes("text")) {
    return "text";
  }
  if (normalized.includes("blob") || normalized.includes("binary") || normalized.includes("bytea")) {
    return "binary";
  }
  return "string";
}

function normalizeDataType(dataType: string): string {
  return dataType.toLowerCase().replace(/\s+/g, " ").trim();
}

function toPrismaModelName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, "_");
  return cleaned
    .split("_")
    .filter((segment) => segment.length > 0)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1).toLowerCase())
    .join("") || "Model";
}

function toPrismaFieldName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, "_");
  if (!/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(cleaned)) {
    return `field_${cleaned.replace(/[^a-zA-Z0-9_]/g, "")}`;
  }
  return cleaned;
}

export function suggestedMigrationFileName(target: BackendMigrationTarget): string {
  switch (target) {
    case "laravel":
      return "create_schema_tables.php";
    case "prisma":
      return "schema.prisma";
    case "knex":
      return "create_schema_tables.ts";
    case "sequelize":
      return "create-schema-tables.cjs";
    case "typeorm":
      return "1710000000000-init-schema.ts";
    default:
      return "migration.txt";
  }
}

export function suggestedMigrationLanguageLabel(target: BackendMigrationTarget): string {
  switch (target) {
    case "laravel":
      return "PHP";
    case "prisma":
      return "Prisma";
    case "knex":
      return "TypeScript";
    case "sequelize":
      return "JavaScript";
    case "typeorm":
      return "TypeScript";
    default:
      return "Text";
  }
}

export function suggestedMigrationExtensions(target: BackendMigrationTarget): string[] {
  switch (target) {
    case "laravel":
      return ["php"];
    case "prisma":
      return ["prisma"];
    case "knex":
      return ["ts", "js"];
    case "sequelize":
      return ["cjs", "js"];
    case "typeorm":
      return ["ts"];
    default:
      return ["txt"];
  }
}

export function targetLabel(target: BackendMigrationTarget): string {
  switch (target) {
    case "laravel":
      return "Laravel";
    case "prisma":
      return "Prisma";
    case "knex":
      return "Knex";
    case "sequelize":
      return "Sequelize";
    case "typeorm":
      return "TypeORM";
    default:
      return "Migration";
  }
}

export function tableCount(schema: SchemaModel): number {
  return schema.tables.length;
}

export function columnCount(table: TableDefinition): number {
  return table.columns.length;
}