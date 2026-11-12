import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_LEARNING_PATHS,
  buildReferenceTemplate,
} from "./template-builders";
import { PART_1_BLUEPRINTS } from "./template-catalog-part1";
import { PART_2_BLUEPRINTS } from "./template-catalog-part2";
import type { ArchitectureTemplate } from "./template-schemas";

export { TEMPLATE_CATEGORIES, TEMPLATE_LEARNING_PATHS };

export const BUILTIN_ARCHITECTURE_TEMPLATES: ArchitectureTemplate[] = [
  ...PART_1_BLUEPRINTS,
  ...PART_2_BLUEPRINTS,
].map(buildReferenceTemplate);
