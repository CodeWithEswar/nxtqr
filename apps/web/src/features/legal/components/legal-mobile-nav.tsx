"use client";

import React, { useState } from "react";
import type { LegalSectionMeta } from "../config/legal-documents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nxtqr/ui";

interface LegalMobileNavProps {
  sections: LegalSectionMeta[];
}

export function LegalMobileNav({ sections }: LegalMobileNavProps) {
  const [selectedSection, setSelectedSection] = useState<string>("");

  const handleSelect = (id: string) => {
    setSelectedSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <div className="lg:hidden w-full mb-6 p-3 rounded-md border border-border-default bg-surface-01 shadow-level-1">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Jump to section
        </span>
        <span className="font-mono text-[10px] text-text-muted">
          {sections.length} total
        </span>
      </div>
      <Select value={selectedSection} onValueChange={handleSelect}>
        <SelectTrigger className="w-full h-9 font-mono text-xs bg-surface-00 border-border-default">
          <SelectValue placeholder="Select a section..." />
        </SelectTrigger>
        <SelectContent className="bg-surface-02 border-border-strong max-h-72">
          {sections.map((sec) => (
            <SelectItem key={sec.id} value={sec.id} className="font-mono text-xs cursor-pointer">
              <span className="text-text-muted mr-2">{sec.number}.</span>
              <span>{sec.title}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
