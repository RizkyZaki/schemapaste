# SchemaPaste

Turn raw SQL DDL into an interactive ERD without leaving VS Code.

SchemaPaste is built for backend engineers who want to inspect schema structure fast, catch relationship mistakes early, and export artifacts for documentation or implementation.

## Why SchemaPaste

- Work directly inside VS Code in a dedicated sidebar view
- Paste CREATE TABLE SQL and get live ERD updates
- Understand PK/FK/unique/nullability metadata at a glance
- Export diagrams and migration starter files for common backend stacks

## Features

- Sidebar-first UX: open SchemaPaste from the Activity Bar
- Command palette support: `SchemaPaste: Open ERD`
- Dialect-aware parsing: MySQL, PostgreSQL, SQLite
- Interactive ERD canvas: drag, zoom, pan, minimap, fit view, auto layout
- Export ERD as SVG/PNG
- Save and load schema snapshots as JSON
- Export migration starter files for:
	- Laravel
	- Prisma
	- Knex
	- Sequelize
	- TypeORM

## How To Use

1. Click the SchemaPaste icon in the VS Code Activity Bar.
2. Paste your SQL DDL into the editor panel.
3. Review the generated ERD and relationships.
4. Export to image or migration format from the toolbar.

## Commands

- `schemapaste.openErd` : Open SchemaPaste in a standalone panel

## Demo Gallery

Use these GIF assets for marketplace-ready visual walkthrough.

### 1) Paste SQL

![Paste SQL](media/demo/01-paste-sql.gif)

### 2) Inspect ERD

![Inspect ERD](media/demo/02-inspect-erd.gif)

### 3) Export Migration

![Export Migration](media/demo/03-export-migration.gif)

## Notes About Migration Export

Migration output is generated as scaffold code to accelerate setup. Review and adjust data types, indexes, defaults, and dialect-specific details before production usage.

## Publish To VS Code Marketplace

### Pre-publish checklist

1. Update `publisher` in `extension/package.json` to your marketplace publisher ID.
2. Replace repository URL with your real GitHub repository.
3. Keep icon path valid in `contributes.viewsContainers.activitybar.icon`.
4. Add demo GIF files to `extension/media/demo/` with these names:
	- `01-paste-sql.gif`
	- `02-inspect-erd.gif`
	- `03-export-migration.gif`

### Package locally

From monorepo root:

1. `pnpm install`
2. `pnpm build`
3. `pnpm --filter schemapaste package`

This creates `schemapaste.vsix` in repo root.

### Publish

1. Create a Personal Access Token (PAT) in Azure DevOps for Marketplace publishing.
2. Login once:
	- `pnpm --filter schemapaste exec @vscode/vsce login <publisher-id>`
3. Publish from extension package script:
	- `pnpm --filter schemapaste publish`

### Optional private distribution

If you do not want to publish publicly yet, share the generated `.vsix` file and install via:

- Extensions view menu
- Install from VSIX...

## Development

From the monorepo root:

1. `pnpm install`
2. `pnpm build`
3. Press `F5` to launch Extension Development Host

Hot reload webview development:

1. Run `pnpm dev` in `webview/`
2. Start extension host with `SCHEMAPASTE_WEBVIEW_DEV_SERVER=http://localhost:5173`
