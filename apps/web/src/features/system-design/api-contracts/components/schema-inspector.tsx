"use client";

/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Schema Inspector Component
 */

import React from "react";
import type { NormalizedSchema } from "@nxtqr/architecture-intelligence";
import { DatabaseIcon, CloseIcon } from "@nxtqr/icons";

interface SchemaInspectorProps {
  schema: NormalizedSchema | null;
  onClose: () => void;
  onSelectPropertySchema?: (propertySchema: NormalizedSchema) => void;
}

export function SchemaInspector({
  schema,
  onClose,
  onSelectPropertySchema,
}: SchemaInspectorProps) {
  if (!schema) {
    return (
      <div className="w-96 h-full flex flex-col items-center justify-center p-6 bg-[#080808] border-l border-[#262626] text-center text-[#858585]">
        <DatabaseIcon className="w-8 h-8 mb-2 text-[#404040]" />
        <p className="text-xs">Select a data schema to inspect field definitions and types.</p>
      </div>
    );
  }

  const properties = schema.properties ? Object.entries(schema.properties) : [];

  return (
    <aside className="w-96 h-full flex flex-col bg-[#080808] border-l border-[#262626] select-none overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-[#262626] flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626]">
              {schema.type}
            </span>
            <span className="text-xs font-mono font-medium text-[#FFFFFF] truncate">
              {schema.name || schema.id}
            </span>
          </div>
          {schema.description && (
            <p className="text-[11px] text-[#858585] truncate">{schema.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[#858585] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
          title="Close Schema Inspector"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Schema Attributes */}
        <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-[#858585]">Nullable:</span>
            <span className="font-mono text-[#FFFFFF]">{schema.isNullable ? "true" : "false"}</span>
          </div>
          {schema.format && (
            <div className="flex items-center justify-between">
              <span className="text-[#858585]">Format:</span>
              <span className="font-mono text-[#FFFFFF]">{schema.format}</span>
            </div>
          )}
          {schema.fieldNumber !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-[#858585]">Protobuf Wire Tag:</span>
              <span className="font-mono text-[#FFFFFF]">Tag #{schema.fieldNumber}</span>
            </div>
          )}
          {schema.wireType !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-[#858585]">Wire Type:</span>
              <span className="font-mono text-[#FFFFFF]">{schema.wireType}</span>
            </div>
          )}
        </div>

        {/* Enum Values */}
        {schema.enumValues && schema.enumValues.length > 0 && (
          <div>
            <h5 className="text-[10px] font-semibold tracking-wide uppercase text-[#858585] mb-2">
              Enum Values ({schema.enumValues.length})
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {schema.enumValues.map((val, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[11px] font-mono rounded-md bg-[#0D0D0D] border border-[#262626] text-[#FFFFFF]"
                >
                  {String(val)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Object Properties */}
        <div>
          <h5 className="text-[10px] font-semibold tracking-wide uppercase text-[#858585] mb-2 flex items-center justify-between">
            <span>Fields & Properties</span>
            <span className="font-mono text-[#666666]">{properties.length}</span>
          </h5>

          {properties.length === 0 ? (
            <p className="text-[11px] text-[#666666] italic">No nested properties defined.</p>
          ) : (
            <div className="space-y-1.5">
              {properties.map(([propName, propSchema]) => {
                const isRequired = schema.requiredProperties?.includes(propName);

                return (
                  <div
                    key={propName}
                    className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-medium text-[#FFFFFF]">{propName}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-[#858585]">
                          {propSchema.type}
                        </span>
                        {isRequired ? (
                          <span className="text-[9px] px-1 py-0.2 rounded-md bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333]">
                            REQ
                          </span>
                        ) : (
                          <span className="text-[9px] text-[#666666]">opt</span>
                        )}
                      </div>
                    </div>

                    {propSchema.description && (
                      <p className="text-[10px] text-[#858585]">{propSchema.description}</p>
                    )}

                    <div className="flex items-center justify-between text-[10px] font-mono text-[#666666] pt-1 border-t border-[#141414]">
                      <span>nullable: {propSchema.isNullable ? "yes" : "no"}</span>
                      {propSchema.fieldNumber !== undefined && (
                        <span>tag: #{propSchema.fieldNumber}</span>
                      )}
                      {propSchema.properties && onSelectPropertySchema && (
                        <button
                          onClick={() => onSelectPropertySchema(propSchema)}
                          className="text-[#FFFFFF] hover:underline"
                        >
                          inspect object →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Array Items */}
        {schema.items && (
          <div>
            <h5 className="text-[10px] font-semibold tracking-wide uppercase text-[#858585] mb-2">
              Array Item Schema
            </h5>
            <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[#FFFFFF]">{schema.items.type}</span>
                <span className="text-[10px] text-[#858585]">
                  nullable: {schema.items.isNullable ? "yes" : "no"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

