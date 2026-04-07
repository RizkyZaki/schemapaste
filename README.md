# SchemaPaste

SchemaPaste is a VS Code extension that transforms raw SQL DDL into a live interactive ERD, now accessible directly from the Activity Bar sidebar.

## Highlights

- Sidebar view: open SchemaPaste from the Activity Bar
- Command: `SchemaPaste: Open ERD`
- Keyboard shortcut: `Ctrl+Shift+V`
- Real-time SQL to ERD rendering
- PK, FK, unique and nullable metadata visualization
- Auto layout with Dagre
- Draggable nodes, zoom, pan, minimap, fit-view
- Export diagram as PNG/SVG
- Export backend migration starter files: Laravel, Prisma, Knex, Sequelize, TypeORM
- Save/load schema snapshots as JSON
- Dialect support: MySQL, PostgreSQL, SQLite

## Monorepo Structure

- `extension/` VS Code extension host entrypoint and webview bridge
- `webview/` React + Vite UI for SQL editing and ERD rendering
- `core/` parser, transform, layout, and export utilities

## Development

```bash
pnpm install
pnpm dev
pnpm watch:extension
```

For extension development, press `F5` in VS Code to launch an Extension Development Host.

### Hot Reload Setup

Run `pnpm dev` in `webview/` and set `SCHEMAPASTE_WEBVIEW_DEV_SERVER=http://localhost:5173` in the extension host environment. The extension will load the live Vite app instead of static assets.

## Build

```bash
pnpm build
```

## Package VSIX

```bash
pnpm package:vsix
```

## Core Test

```bash
pnpm test
```

## Roadmap

Next planned exports and improvements:

- Mermaid export
- DBML export
- Reverse SQL generation
- Deeper type/default/index mapping for all migration targets
