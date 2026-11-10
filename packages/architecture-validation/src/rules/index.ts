import type { ArchitectureValidationRule } from "../contracts/validation.types";
import { directionRules } from "./direction-rules";
import { protocolRules } from "./protocol-rules";
import { relationshipRules } from "./relationship-rules";
import { structuralRules } from "./structural-rules";
import { dependencyRules } from "./dependency-rules";
import { configurationRules } from "./configuration-rules";

export const ALL_VALIDATION_RULES: readonly ArchitectureValidationRule[] = Object.freeze(
  [
    ...structuralRules,
    ...directionRules,
    ...protocolRules,
    ...relationshipRules,
    ...dependencyRules,
    ...configurationRules,
  ].sort((a, b) => a.order - b.order),
);

export {
  directionRules,
  protocolRules,
  relationshipRules,
  structuralRules,
  dependencyRules,
  configurationRules,
};
