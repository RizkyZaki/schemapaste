# Extensibility Guide: Adding a New Framework Parser

## 1) Create Parser Adapter

- Add a folder under `src/parsers/<framework>/`.
- Implement `SchemaParserAdapter` from `src/parsers/registry/types.ts`.
- Return `SchemaParseResult` with normalized schema or parse issues.

## 2) Register Parser

- Register adapter in `createDefaultParserRegistry.ts`.
- Add source type literal to `SchemaSourceType` in `types/normalizedSchema.ts`.

## 3) Add UI Source Selector Option

- Add source type option to workspace creation command and webview selector.

## 4) Add Export Strategy (Optional)

- Implement `WorkspaceExportStrategy` and register in `createDefaultExportService.ts`.

## 5) Add Test Coverage

- Add parser fixture files.
- Add snapshot tests for normalized schema output.
- Add malformed syntax tests for diagnostics quality.
