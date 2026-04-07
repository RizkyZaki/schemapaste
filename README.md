# SchemaPaste

SchemaPaste is a VS Code extension for turning schema source code into interactive ERD workspaces.

It is designed for backend engineers who want to inspect table relationships quickly, keep schema history inside the editor, and export documentation or starter artifacts.

## Release

- Current extension version: `0.1.1`
- Changelog: [CHANGELOG.md](CHANGELOG.md)

## Extension Highlights

- Workspace-based flow in Activity Bar sidebar
- Multi-source parser mode:
	- SQL
	- Laravel migration
	- Prisma schema
	- Drizzle schema
	- TypeORM entities
	- Sequelize models
	- Django models
- Interactive ERD canvas with drag, reconnect, fit view, and auto layout
- Save/load schema snapshot JSON
- Export workspace in multiple formats:
	- PNG
	- SVG
	- PDF
	- JSON workspace
	- Normalized schema JSON
	- Source conversion (`sql`, `laravel`, `prisma`, `drizzle`, `typeorm`, `sequelize`, `django`)

## How To Use

1. Open the SchemaPaste icon from the VS Code Activity Bar.
2. Click `New ERD Workspace`.
3. Select your source type.
4. Paste schema source in the editor panel.
5. Review ERD and diagnostics.
6. Use toolbar or context menu to export / manage workspaces.

## Main Commands

- `SchemaPaste: New ERD Workspace`
- `SchemaPaste: Open Workspace`
- `SchemaPaste: Search Workspaces`
- `SchemaPaste: Toggle Workspace Sort`
- `SchemaPaste: Open ERD` (legacy entrypoint, mapped to new workspace flow)

## Local Development

```bash
pnpm install
pnpm build
```

Press `F5` in VS Code to launch Extension Development Host.

Hot reload workflow:

1. `pnpm dev` in `webview/`
2. `pnpm watch` in `extension/`
3. Launch extension host with `SCHEMAPASTE_WEBVIEW_DEV_SERVER=http://localhost:5173`

## Package VSIX

```bash
pnpm package:vsix
```

Output file: `schemapaste.vsix` in repository root.

## Repository Structure

- `extension/` VS Code extension host, custom editor, commands, repository state, exporters
- `webview/` React UI and canvas interactions
- `core/` SQL parser adapter and graph/layout utilities

## Additional Docs

- Extension-focused README: [extension/README.md](extension/README.md)
- Architecture notes: [extension/docs/ARCHITECTURE.md](extension/docs/ARCHITECTURE.md)
- Extensibility guide: [extension/docs/EXTENSIBILITY_GUIDE.md](extension/docs/EXTENSIBILITY_GUIDE.md)
