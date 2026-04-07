import { describe, expect, it } from "vitest";
import { NodeSqlParserAdapter } from "../src/parser/nodeSqlParserAdapter";

describe("NodeSqlParserAdapter", () => {
  it("parses create table and relationships", () => {
    const adapter = new NodeSqlParserAdapter();
    const sql = `
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL
      );

      CREATE TABLE posts (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT,
        CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `;

    const result = adapter.parse(sql, "sqlite");
    expect(result.errors.length).toBe(0);
    expect(result.schema?.tables.length).toBe(2);
    const posts = result.schema?.tables.find((table) => table.name === "posts");
    expect(posts?.foreignKeys.length).toBe(1);
    expect(posts?.foreignKeys[0]?.targetTable).toBe("users");
  });

  it("returns errors for invalid sql", () => {
    const adapter = new NodeSqlParserAdapter();
    const result = adapter.parse("CREATE TABLE ;", "mysql");
    expect(result.schema).toBeNull();
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
