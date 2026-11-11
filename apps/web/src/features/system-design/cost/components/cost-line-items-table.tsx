"use client";

import * as React from "react";
import { Badge, Input } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import {
  DecimalMoney,
  type CostEstimate,
  type BillableResourceCategory,
} from "@nxtqr/architecture-intelligence";
import { SearchIcon, AlertCircleIcon } from "@nxtqr/icons";

export interface CostLineItemsTableProps {
  estimate: CostEstimate;
  className?: string;
  onSelectNode?: (nodeId: string) => void;
  selectedCategory?: BillableResourceCategory | null;
  onClearCategoryFilter?: () => void;
}

export function CostLineItemsTable({
  estimate,
  className,
  onSelectNode,
  selectedCategory,
  onClearCategoryFilter,
}: CostLineItemsTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredItems = React.useMemo(() => {
    return estimate.lineItems.filter((item) => {
      // Category filter
      if (selectedCategory && item.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesLabel = item.nodeLabel.toLowerCase().includes(query);
        const matchesSku = (item.skuId || "").toLowerCase().includes(query);
        const matchesResource = item.resourceName.toLowerCase().includes(query);
        return matchesLabel || matchesSku || matchesResource;
      }

      return true;
    });
  }, [estimate.lineItems, selectedCategory, searchTerm]);

  return (
    <div className={cn("flex flex-col gap-3 rounded-md border border-[#262626] bg-[#0A0A0A] p-4 text-white", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
            Billable Resource Line Items
          </h3>
          <span className="text-[11px] text-[#666666]">
            {filteredItems.length} of {estimate.lineItems.length} resources displayed
          </span>
        </div>

        {/* Search Input */}
        <div className="relative w-48">
          <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#666666]" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items..."
            className="h-7 rounded-md border-[#262626] bg-[#111111] pl-8 pr-2 text-xs text-white placeholder:text-[#666666] focus-visible:border-[#333333] focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Active Category Filter Tag */}
      {selectedCategory && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#858585]">Filtered by:</span>
          <Badge
            variant="outline"
            className="flex items-center gap-1 rounded-md border-[#333333] bg-[#141414] px-2 py-0.5 text-xs text-white"
          >
            <span>{selectedCategory}</span>
            <button
              onClick={onClearCategoryFilter}
              className="ml-1 text-[#858585] hover:text-white"
            >
              ×
            </button>
          </Badge>
        </div>
      )}

      {/* Table Container */}
      <div className="max-h-80 overflow-y-auto rounded-md border border-[#202020] bg-[#080808]">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 border-b border-[#202020] bg-[#0F0F0F] text-[#858585]">
            <tr>
              <th className="px-3 py-2 font-medium">Component</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Quantity</th>
              <th className="px-3 py-2 text-right font-medium">Unit Rate</th>
              <th className="px-3 py-2 text-right font-medium">Monthly Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A1A]">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-[#666666]">
                  No line items matching query.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const formattedExtended = DecimalMoney.format(item.extendedMonthlyCost, estimate.currency);

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectNode?.(item.nodeId)}
                    className="cursor-pointer transition-colors hover:bg-[#141414]"
                  >
                    <td className="px-3 py-2 font-medium text-white">
                      <div className="flex flex-col">
                        <span>{item.nodeLabel}</span>
                        <span className="font-mono text-[10px] text-[#666666]">
                          {item.resourceName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant="outline"
                        className="rounded-md border-[#262626] bg-[#0D0D0D] px-1.5 py-0 text-[10px] uppercase text-[#858585]"
                      >
                        {item.category}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-[#B5B5B5]">
                      {item.quantity.toLocaleString()} {item.unit}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[#858585]">
                      {item.isUnpriced ? "—" : `$${item.unitPrice}`}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">
                      {item.isUnpriced ? (
                        <div className="flex items-center justify-end gap-1 text-[#E5A84B]">
                          <AlertCircleIcon className="h-3 w-3 shrink-0" />
                          <span className="text-[11px]">Unpriced SKU</span>
                        </div>
                      ) : (
                        <span className="text-white">{formattedExtended}</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

