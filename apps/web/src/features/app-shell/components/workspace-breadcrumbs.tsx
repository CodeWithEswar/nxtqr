"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@nxtqr/ui";
import { ChevronRightIcon } from "@nxtqr/icons";
import { ALL_NAVIGATION_ITEMS } from "../config/navigation";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { cn } from "@nxtqr/utils";

export interface WorkspaceBreadcrumbsProps {
  className?: string;
}

export function WorkspaceBreadcrumbs({ className }: WorkspaceBreadcrumbsProps) {
  const pathname = usePathname();

  // Split path into segments
  const segments = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb className={cn("min-w-0 overflow-hidden", className)}>
      <BreadcrumbList className="text-xs font-mono flex-nowrap items-center overflow-hidden min-w-0">
        <BreadcrumbItem className="shrink min-w-0">
          <WorkspaceSwitcher variant="breadcrumb" />
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          // If first segment is 'workspace' and there are deeper segments, skip 'workspace' to keep breadcrumb compact
          if (segment === "workspace" && segments.length > 1) {
            return null;
          }

          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;

          // Look up friendly label from navigation items if available
          const matchingItem = ALL_NAVIGATION_ITEMS.find((item) => item.href === href);
          const rawLabel = matchingItem?.label ?? segment.replace(/-/g, " ");
          const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator
                className={cn(
                  "text-text-disabled shrink-0",
                  !isLast && "hidden sm:inline-flex"
                )}
              >
                <ChevronRightIcon className="h-3 w-3" />
              </BreadcrumbSeparator>

              <BreadcrumbItem
                className={cn(
                  "truncate min-w-0",
                  !isLast && "hidden sm:inline-flex"
                )}
              >
                {isLast ? (
                  <BreadcrumbPage className="text-foreground font-semibold truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[200px]">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={href}
                      className="text-text-muted hover:text-foreground transition-colors truncate max-w-[70px] sm:max-w-[120px]"
                    >
                      {label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

