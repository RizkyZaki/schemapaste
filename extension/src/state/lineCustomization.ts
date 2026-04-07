import type {
  ErdWorkspaceLineCustomization,
  NormalizedRelationshipDefinition,
  NormalizedRelationshipLineSettings
} from "../types/normalizedSchema";

export function createDefaultRelationshipLineSettings(
  customization: ErdWorkspaceLineCustomization
): NormalizedRelationshipLineSettings {
  return {
    style: customization.defaultStyle,
    color: customization.defaultColor,
    thickness: customization.defaultThickness,
    dashed: customization.defaultDashed,
    labelVisible: customization.showLabels,
    cardinalityVisible: customization.showCardinality,
    highlighted: false,
    reroutePoints: []
  };
}

export function applyDefaultLineCustomization(
  relationships: NormalizedRelationshipDefinition[],
  customization: ErdWorkspaceLineCustomization
): NormalizedRelationshipDefinition[] {
  return relationships.map((relationship) => ({
    ...relationship,
    line: {
      ...createDefaultRelationshipLineSettings(customization),
      ...relationship.line
    }
  }));
}
