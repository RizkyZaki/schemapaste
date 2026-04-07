# SchemaPaste

SchemaPaste turns SQL DDL into an interactive ERD directly inside VS Code.

It is designed for backend developers who want to inspect table relationships quickly, generate visual documentation, and bootstrap migration files for popular frameworks.

## Current Version

- Monorepo: `0.1.0`
- VS Code extension: `0.1.0`
- Core package: `0.1.0`
- Webview package: `0.1.0`

Version history is tracked in [CHANGELOG.md](CHANGELOG.md).

## What You Can Do

- Open SchemaPaste from the Activity Bar sidebar
- Use command palette: `SchemaPaste: Open ERD`
- Parse SQL DDL in real time (MySQL, PostgreSQL, SQLite)
- Explore ERD with drag, zoom, pan, minimap, fit view, auto layout
- Visualize PK, FK, unique, and nullability metadata
- Export ERD as SVG and PNG
- Export migration starter files for:
	- Laravel
	- Prisma
	- Knex
	- Sequelize
	- TypeORM
- Save and load schema snapshot JSON

## Project Structure

- `extension/`: VS Code extension host and webview bridge
- `webview/`: React + Vite interface
- `core/`: parser, transform, layout, and export engine

## Quick Start (Development)

```bash
pnpm install
pnpm build
```

Then run `F5` in VS Code to open Extension Development Host.

## Hot Reload Workflow

1. Run webview dev server:

```bash
pnpm dev
```

2. Run extension watch:

```bash
pnpm watch:extension
```

3. Start Extension Development Host with env var:

```bash
SCHEMAPASTE_WEBVIEW_DEV_SERVER=http://localhost:5173
```

## Build And Test

Build all packages:

```bash
pnpm build
```

Run core tests:

```bash
pnpm test
```

Package VSIX:

```bash
pnpm package:vsix
```

## Roadmap

- Mermaid export
- DBML export
- Reverse SQL generation
- Deeper data-type/default/index mapping across migration targets
- Marketplace polish (demo media, metadata, publish workflow)

## Additional Docs

- Extension marketplace README: [extension/README.md](extension/README.md)
- Changelog: [CHANGELOG.md](CHANGELOG.md)
