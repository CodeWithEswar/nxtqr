"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent, Button } from "@nxtqr/ui";
import { CopyIcon, CheckIcon } from "@nxtqr/icons";

export interface InstallationCommandProps {
  packageName?: string;
  command?: string;
}

export function InstallationCommand({
  packageName = "@nxtqr/ui",
  command,
}: InstallationCommandProps) {
  const [copied, setCopied] = React.useState(false);
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

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="my-4 rounded-md border border-border bg-[#0A0A0A] p-2 shadow-level-1">
      <Tabs defaultValue="pnpm" value={activePm} onValueChange={setActivePm}>
        <div className="flex items-center justify-between border-b border-border/60 pb-2 px-1">
          <TabsList className="h-7 bg-black/50 p-0.5">
            {["pnpm", "npm", "yarn", "bun"].map((pm) => (
              <TabsTrigger
                key={pm}
                value={pm}
                className="h-6 px-2.5 font-mono text-[11px] data-[state=active]:bg-surface data-[state=active]:text-foreground"
              >
                {pm}
              </TabsTrigger>
            ))}
          </TabsList>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(commands[activePm] ?? "")}
            aria-label="Copy installation command"
            className="h-6 px-2 font-mono text-[10px] text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <>
                <CheckIcon className="h-3 w-3 mr-1 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <CopyIcon className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>

        {Object.entries(commands).map(([pm, cmd]) => (
          <TabsContent
            key={pm}
            value={pm}
            className="mt-2 px-2 py-1 font-mono text-xs text-foreground/90"
          >
            <code>{cmd}</code>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
