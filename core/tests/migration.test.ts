import { describe, expect, it } from "vitest";
import { generateBackendMigration, type SchemaModel } from "../src";

const schema: SchemaModel = {
  dialect: "mysql",
  tables: [
    {
      name: "users",
      columns: [
        {
          name: "id",
          dataType: "INTEGER",
          nullable: false,
          isPrimaryKey: true,
          isForeignKey: false,
          isUnique: false
        },
        {
          name: "email",
          dataType: "VARCHAR(255)",
          nullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          isUnique: true
        }
      ],
      primaryKeys: ["id"],
      uniqueKeys: ["email"],
      foreignKeys: []
    },
    {
      name: "posts",
      columns: [
        {
          name: "id",
          dataType: "INTEGER",
          nullable: false,
          isPrimaryKey: true,
          isForeignKey: false,
          isUnique: false
        },
        {
          name: "user_id",
          dataType: "INTEGER",
          nullable: false,
          isPrimaryKey: false,
          isForeignKey: true,
          isUnique: false
        },
        {
          name: "title",
          dataType: "TEXT",
          nullable: true,
          isPrimaryKey: false,
          isForeignKey: false,
          isUnique: false
        }
      ],
      primaryKeys: ["id"],
      uniqueKeys: [],
      foreignKeys: [
        {
          sourceTable: "posts",
          sourceColumn: "user_id",
          targetTable: "users",
          targetColumn: "id"
        }
      ]
    }
  ]
};

describe("migration export", () => {
  it("generates laravel migration", () => {
    const output = generateBackendMigration(schema, "laravel");
    expect(output).toContain("Schema::create('users'");
    expect(output).toContain("$table->integer('user_id')");
    expect(output).toContain("$table->foreign('user_id')->references('id')->on('users');");
  });

  it("generates prisma schema", () => {
    const output = generateBackendMigration(schema, "prisma");
    expect(output).toContain("model Users");
    expect(output).toContain("email String @unique");
    expect(output).toContain("model Posts");
  });

  it("generates knex migration", () => {
    const output = generateBackendMigration(schema, "knex");
    expect(output).toContain("await knex.schema.createTable('users'");
    expect(output).toContain("table.text('title')");
    expect(output).toContain("table.foreign('user_id').references('id').inTable('users');");
  });
});
