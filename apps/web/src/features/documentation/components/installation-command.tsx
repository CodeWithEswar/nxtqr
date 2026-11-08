"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@nxtqr/ui";
import { CodeCopyButton } from "./code-block/code-copy-button";
import { cn } from "@nxtqr/utils";

export interface InstallationCommandProps {
  packageName?: string;
  command?: string;
  className?: string;
}

export function InstallationCommand({
  packageName = "@nxtqr/ui",
  command,
  className,
}: InstallationCommandProps) {
  const [activePm, setActivePm] = React.useState("pnpm");

  const commands: Record<string, string> = command
    ? {
        pnpm: command,
        npm: command.replace(/^pnpm add/, "npm install"),
        yarn: command.replace(/^pnpm add/, "yarn add"),
        bun: command.replace(/^pnpm add/, "bun add"),
      }
    : {
        pnpm: `pnpm add ${packageName}`,
        npm: `npm install ${packageName}`,
        yarn: `yarn add ${packageName}`,
        bun: `bun add ${packageName}`,
      };

  return (
    <div
      className={cn(
        "my-4 rounded-md border border-border bg-[#0A0A0A] overflow-hidden shadow-level-1",
        className,
      )}
    >
      <Tabs defaultValue="pnpm" value={activePm} onValueChange={setActivePm}>
        {/* Header with PM switcher tabs and quick copy */}
        <div className="flex items-center justify-between border-b border-border bg-black/60 px-3 py-1.5 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <TabsList className="h-7 bg-surface/80 p-0.5 border border-subtle-border">
              {["pnpm", "npm", "yarn", "bun"].map((pm) => (
                <TabsTrigger
                  key={pm}
                  value={pm}
                  className="h-6 px-2.5 font-mono text-[11px] data-[state=active]:bg-secondary-surface data-[state=active]:text-foreground"
                >
                  {pm}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <CodeCopyButton
            code={commands[activePm] ?? ""}
            className="h-6 px-2 text-[10px]"
          />
        </div>

        {/* Syntax-highlighted terminal command execution output */}
        {Object.entries(commands).map(([pm, cmd]) => (
          <TabsContent
            key={pm}
            value={pm}
            className="m-0 p-3 bg-black/95 font-mono text-xs overflow-x-auto scrollbar-dense"
          >
            <div className="flex items-center">
              <span
                className="text-[#525252] select-none mr-3 font-mono text-xs"
                aria-hidden="true"
              >
                $
              </span>
              <HighlightedCommandLine command={cmd} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function HighlightedCommandLine({ command }: { command: string }) {
  const parts = command.trim().split(/\s+/);

  return (
    <code className="font-mono text-xs leading-relaxed inline-flex items-center flex-wrap">
      {parts.map((part, index) => {
        // Binary / Executable: pnpm, npm, yarn, bun, npx, dlx
        if (index === 0) {
          return (
            <span key={index} className="text-[#B388FF] font-medium mr-2">
              {part}
            </span>
          );
        }

        // Subcommand: add, install, i, create, dlx
        if (index === 1 && !part.startsWith("-")) {
          return (
            <span key={index} className="text-[#FACC15] mr-2">
              {part}
            </span>
          );
        }

        // Flags / Options: -D, --save-dev, -E, etc.
        if (part.startsWith("-")) {
          return (
            <span key={index} className="text-[#FB923C] mr-2">
              {part}
            </span>
          );
        }

        // Package identifiers: @nxtqr/ui, etc.
        return (
          <span key={index} className="text-[#34D399] mr-2">
            {part}
          </span>
        );
      })}
    </code>
  );
}
