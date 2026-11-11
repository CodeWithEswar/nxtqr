"use client";

/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Entity-Relationship (ER) Diagram Visualizer
 */

import React from "react";
import type { DatabaseSchema, DatabaseTable } from "@nxtqr/architecture-intelligence";
import { DatabaseIcon, LayersIcon } from "@nxtqr/icons";

export interface ERDiagramViewProps {
  schemas: DatabaseSchema[];
  selectedTableId: string | null;
  onSelectTable: (tableId: string) => void;
}

export function ERDiagramView({
  schemas,
  selectedTableId,
  onSelectTable,
}: ERDiagramViewProps) {
  const allTables: DatabaseTable[] = schemas.flatMap((s) => s.tables);
  const allRelationships = schemas.flatMap((s) => s.relationships);

  return (
    <div className="flex flex-col h-full bg-[#000000] overflow-y-auto p-6 space-y-6">
      {/* ER Diagram Canvas Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-[#FFFFFF]" />
            Entity-Relationship Topology & Relational Model
          </h2>
          <p className="text-xs text-[#858585] mt-0.5">
            Interactive entity cards, schema definitions, key constraints, and relational cardinalities.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#858585]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FFFFFF]" />
            Primary Key
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#858585]" />
            Foreign Key
          </span>
        </div>
      </div>

      {/* Table Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allTables.map((table) => {
          const isSelected = selectedTableId === table.id;
          return (
            <div
              key={table.id}
              onClick={() => onSelectTable(table.id)}
              className={`p-4 rounded-md cursor-pointer transition-all border ${
                isSelected
                  ? "bg-[#141414] border-[#404040] shadow-level-2"
                  : "bg-[#080808] border-[#262626] hover:border-[#333333] hover:bg-[#0D0D0D]"
              }`}
            >
              {/* Table Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#202020] mb-3">
                <div className="flex items-center gap-2">
                  <DatabaseIcon className="w-3.5 h-3.5 text-[#B5B5B5]" />
                  <span className="text-xs font-bold text-[#FFFFFF] font-mono">
                    {table.name}
                  </span>
                </div>
                <span className="text-[10px] text-[#858585] font-mono">
                  {(table.estimatedRowCount / 1000000).toFixed(1)}M rows
                </span>
              </div>

              {/* Column Rows */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {table.columns.map((col) => {
                  const isFk = table.foreignKeys.some((fk) =>
                    fk.sourceColumnNames.includes(col.name)
                  );
                  return (
                    <div
                      key={col.id}
                      className="flex items-center justify-between text-xs py-1 px-1.5 rounded-md hover:bg-[#141414] transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {col.isPrimaryKey ? (
                          <span className="text-[9px] px-1 py-0.2 rounded-md font-bold bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333]">
                            PK
                          </span>
                        ) : isFk ? (
                          <span className="text-[9px] px-1 py-0.2 rounded-md font-medium bg-[#141414] text-[#858585] border border-[#262626]">
                            FK
                          </span>
                        ) : (
                          <span className="w-4" />
                        )}
                        <span className={`font-mono ${col.isPrimaryKey ? "text-[#FFFFFF] font-medium" : "text-[#B5B5B5]"}`}>
                          {col.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#666666]">
                        {col.dataType}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Table Card Footer */}
              <div className="mt-3 pt-2.5 border-t border-[#202020] flex items-center justify-between text-[10px] text-[#666666]">
                <span>{table.columns.length} columns</span>
                <span>{table.indexes.length} indexes</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Relational Links List */}
      <div className="space-y-3 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
          Relational Dependencies & Junctions ({allRelationships.length})
        </h3>
        {allRelationships.length === 0 ? (
          <div className="p-4 bg-[#080808] border border-[#262626] rounded-md text-xs text-[#858585]">
            No foreign key relationships detected across schemas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allRelationships.map((rel) => (
              <div
                key={rel.id}
                className="p-3 bg-[#080808] border border-[#262626] rounded-md flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#FFFFFF] font-mono">
                      {rel.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626] uppercase">
                      {rel.relationshipType.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#858585] font-mono mt-1">
                    ({rel.sourceColumnNames.join(", ")}) &rarr; ({rel.targetColumnNames.join(", ")})
                  </p>
                </div>
                <div className="text-right text-[10px] text-[#666666]">
                  <span>Enforced: {rel.referentialIntegrityEnforced ? "YES" : "NO"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
