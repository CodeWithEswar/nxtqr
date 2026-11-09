import type { z } from "zod";
import type { PortDefinition } from "@nxtqr/graph-schema";

export interface InfrastructureCategoryDefinition {
  id: string;
  name: string;
  description: string;
  iconSlug?: string;
  order: number;
}

export type InspectorFieldType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "multiselect"
  | "textarea";

export interface InspectorFieldOption {
  label: string;
  value: string;
}

export interface InspectorFieldDefinition {
  path: string;
  label: string;
  type: InspectorFieldType;
  options?: readonly InspectorFieldOption[];
  unit?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export interface InspectorSectionDefinition {
  id: string;
  title: string;
  description?: string;
  fields: readonly InspectorFieldDefinition[];
}

export interface InfrastructureComponentDefinition<
  TConfig extends Record<string, unknown> = Record<string, unknown>
> {
  id: string;
  version: number;
  categoryId: string;

  display: {
    name: string;
    shortName: string;
    description: string;
    keywords: readonly string[];
    iconSlug: string;
  };

  configSchema: z.ZodType<TConfig, z.ZodTypeDef, any>;
  defaultConfig: TConfig;

  ports: readonly PortDefinition[];

  capabilities: readonly string[];

  inspector: readonly InspectorSectionDefinition[];

  node: {
    variant: "compact" | "standard";
    minWidth: number;
    minHeight: number;
  };
}

export interface CreateInfrastructureNodeOptions {
  id?: string;
  label?: string;
  position?: { x: number; y: number };
  config?: Record<string, unknown>;
  environment?: string;
}
