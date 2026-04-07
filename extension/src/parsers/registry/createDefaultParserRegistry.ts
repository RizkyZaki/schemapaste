import { LaravelMigrationParser } from "../laravel/laravelMigrationParser";
import { DrizzleSchemaParser } from "../drizzle/drizzleSchemaParser";
import { PrismaSchemaParser } from "../prisma/prismaSchemaParser";
import { SequelizeModelParser } from "../sequelize/sequelizeModelParser";
import { SqlSourceParser } from "../sql/sqlSourceParser";
import { DjangoModelParser } from "../django/djangoModelParser";
import { TypeOrmEntityParser } from "../typeorm/typeOrmEntityParser";
import { SchemaParserRegistry } from "./parserRegistry";

export function createDefaultParserRegistry(): SchemaParserRegistry {
  const registry = new SchemaParserRegistry();

  registry.register(new SqlSourceParser());
  registry.register(new LaravelMigrationParser());
  registry.register(new PrismaSchemaParser());
  registry.register(new DrizzleSchemaParser());
  registry.register(new TypeOrmEntityParser());
  registry.register(new SequelizeModelParser());
  registry.register(new DjangoModelParser());

  return registry;
}
