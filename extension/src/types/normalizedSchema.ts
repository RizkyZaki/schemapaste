export type SchemaSourceType =
  | "sql"
  | "laravel"
  | "prisma"
  | "drizzle"
  | "typeorm"
  | "sequelize"
  | "django";

export type RelationshipCardinality = "1:1" | "1:N" | "N:1" | "N:N";
export type RelationshipLineStyle = "straight" | "smooth" | "bezier" | "stepped";

export interface NormalizedEnumDefinition {
  name: string;
  values: string[];
}

export interface NormalizedIndexDefinition {
  name?: string;
  columns: string[];
  unique: boolean;
}

export interface NormalizedColumnDefinition {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isUnique: boolean;
  enumName?: string;
}

export interface NormalizedForeignKeyDefinition {
  name?: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  onDelete?: string;
  onUpdate?: string;
}

export interface NormalizedRelationshipLineSettings {
  style: RelationshipLineStyle;
  color: string;
  thickness: number;
  dashed: boolean;
  labelVisible: boolean;
  cardinalityVisible: boolean;
  highlighted: boolean;
  reroutePoints: Array<{ x: number; y: number }>;
}

export interface NormalizedRelationshipDefinition {
  id: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  cardinality: RelationshipCardinality;
  label?: string;
  line: NormalizedRelationshipLineSettings;
}

export interface NormalizedTableDefinition {
  name: string;
  columns: NormalizedColumnDefinition[];
  primaryKeys: string[];
  indexes: NormalizedIndexDefinition[];
  foreignKeys: NormalizedForeignKeyDefinition[];
}

export interface NormalizedSchemaModel {
  sourceType: SchemaSourceType;
  tables: NormalizedTableDefinition[];
  enums: NormalizedEnumDefinition[];
  relationships: NormalizedRelationshipDefinition[];
}

export interface ErdNodePosition {
  x: number;
  y: number;
}

export interface ErdWorkspaceLineCustomization {
  defaultStyle: RelationshipLineStyle;
  defaultThickness: number;
  defaultColor: string;
  defaultDashed: boolean;
  showLabels: boolean;
  showCardinality: boolean;
}

export interface ErdWorkspaceExportPreferences {
  imageBackground: string;
  pngScale: number;
  includeMetadata: boolean;
  includeSourceContent: boolean;
}

export interface ErdWorkspaceRecord {
  id: string;
  name: string;
  sourceType: SchemaSourceType;
  originalSourceContent: string;
  normalizedSchema: NormalizedSchemaModel;
  erdNodePositions: Record<string, ErdNodePosition>;
  relationshipMetadata: Record<string, Record<string, unknown>>;
  lineCustomization: ErdWorkspaceLineCustomization;
  exportPreferences: ErdWorkspaceExportPreferences;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SchemaParseIssue {
  level: "error" | "warning";
  message: string;
  line?: number;
  column?: number;
}

export interface SchemaParseResult {
  schema: NormalizedSchemaModel | null;
  issues: SchemaParseIssue[];
}

export const DEFAULT_LINE_CUSTOMIZATION: ErdWorkspaceLineCustomization = {
  defaultStyle: "smooth",
  defaultThickness: 2,
  defaultColor: "#67E8F9",
  defaultDashed: false,
  showLabels: true,
  showCardinality: true
};

export const DEFAULT_EXPORT_PREFERENCES: ErdWorkspaceExportPreferences = {
  imageBackground: "#111827",
  pngScale: 2,
  includeMetadata: true,
  includeSourceContent: true
};
