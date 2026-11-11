"use client";

/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Schema Designer (Columns, Data Types, Constraints & Foreign Keys)
 */

import React from "react";
import type { DatabaseTable } from "@nxtqr/architecture-intelligence";
import { DatabaseIcon, LayersIcon, ShieldIcon } from "@nxtqr/icons";

export interface SchemaDesignerProps {
  table: DatabaseTable | null;
}

export function SchemaDesigner({ table }: SchemaDesignerProps) {
  if (!table) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[#858585]">
        <DatabaseIcon className="w-8 h-8 mb-2 text-[#666666]" />
        <p className="text-sm">Select a table from the catalog to inspect its schema and constraints.</p>
      </div>
    );
  }

  const tableSizeMb = table.tableSizeBytes
    ? (table.tableSizeBytes / (1024 * 1024)).toFixed(1)
    : ((table.estimatedRowCount * table.averageRowSizeBytes) / (1024 * 1024)).toFixed(1);

  return (
    <div className="flex flex-col h-full bg-[#000000] overflow-y-auto p-6 space-y-6">
      {/* Table Header Summary */}
      <div className="p-4 bg-[#080808] border border-[#262626] rounded-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-[#FFFFFF] font-mono">
              {table.schema}.{table.name}
            </span>
            {table.isJunctionTable && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#141414] text-[#B5B5B5] border border-[#333333]">
                Junction Table (M:N)
              </span>
            )}
          </div>
          <p className="text-xs text-[#858585] mt-1">
            Modeled relational table with {table.columns.length} columns and {table.indexes.length} indexes.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-[#666666] block">
              Estimated Rows
            </span>
            <span className="text-sm font-semibold text-[#FFFFFF] font-mono">
              {table.estimatedRowCount.toLocaleString()}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-[#666666] block">
              Avg Row Size
            </span>
            <span className="text-sm font-semibold text-[#FFFFFF] font-mono">
              {table.averageRowSizeBytes} B
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-[#666666] block">
              Storage Footprint
            </span>
            <span className="text-sm font-semibold text-[#FFFFFF] font-mono">
              {tableSizeMb} MB
            </span>
          </div>
        </div>
      </div>

      {/* Columns & Data Types Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-2">
            <LayersIcon className="w-3.5 h-3.5 text-[#B5B5B5]" />
            Table Columns & Constraints ({table.columns.length})
          </h3>
        </div>

        <div className="border border-[#262626] rounded-md overflow-hidden bg-[#080808]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#262626] bg-[#0D0D0D] text-[#858585]">
                <th className="py-2 px-3 font-medium">Column Name</th>
                <th className="py-2 px-3 font-medium">Data Type</th>
                <th className="py-2 px-3 font-medium text-center">Primary Key</th>
                <th className="py-2 px-3 font-medium text-center">Nullable</th>
                <th className="py-2 px-3 font-medium text-center">Unique</th>
                <th className="py-2 px-3 font-medium">Default Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {table.columns.map((col) => (
                <tr key={col.id} className="hover:bg-[#0D0D0D] transition-colors">
                  <td className="py-2.5 px-3 font-mono font-medium text-[#FFFFFF] flex items-center gap-2">
                    {col.name}
                    {col.isPrimaryKey && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333]">
                        PK
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#B5B5B5]">
                    {col.dataType}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {col.isPrimaryKey ? (
                      <span className="text-[10px] text-[#FFFFFF] font-bold">YES</span>
                    ) : (
                      <span className="text-[10px] text-[#666666]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {col.isNullable ? (
                      <span className="text-[10px] text-[#858585]">NULL</span>
                    ) : (
                      <span className="text-[10px] text-[#B5B5B5] font-semibold">NOT NULL</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {col.isUnique ? (
                      <span className="text-[10px] text-[#FFFFFF] font-semibold">UNIQUE</span>
                    ) : (
                      <span className="text-[10px] text-[#666666]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#858585]">
                    {col.defaultValue || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Foreign Key Constraints */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-2">
          <ShieldIcon className="w-3.5 h-3.5 text-[#B5B5B5]" />
          Foreign Key Constraints & Integrity ({table.foreignKeys.length})
        </h3>

        {table.foreignKeys.length === 0 ? (
          <div className="p-4 bg-[#080808] border border-[#262626] rounded-md text-xs text-[#858585]">
            No foreign key constraints defined on this table.
          </div>
        ) : (
          <div className="space-y-2">
            {table.foreignKeys.map((fk) => (
              <div
                key={fk.id}
                className="p-3 bg-[#080808] border border-[#262626] rounded-md flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-[#FFFFFF]">
                      {fk.name}
                    </span>
                    <span className="text-[10px] text-[#858585]">
                      ({fk.sourceColumnNames.join(", ")}) &rarr; {fk.targetTableName}(
                      {fk.targetColumnNames.join(", ")})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-[#666666]">
                    <span>ON DELETE: <strong className="text-[#B5B5B5] uppercase font-mono">{fk.onDeleteAction}</strong></span>
                    <span>•</span>
                    <span>ON UPDATE: <strong className="text-[#B5B5B5] uppercase font-mono">{fk.onUpdateAction}</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#141414] text-[#B5B5B5] border border-[#333333]">
                    Referential Integrity
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
