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

export interface WorkspaceBreadcrumbsProps {
  className?: string;
}

export function WorkspaceBreadcrumbs({ className }: WorkspaceBreadcrumbsProps) {
  const pathname = usePathname();

  // Split path into segments
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <Breadcrumb className={className}>
        <BreadcrumbList className="text-xs font-mono">
          <BreadcrumbItem>
            <BreadcrumbPage className="text-foreground font-semibold">
              Studio
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="text-xs font-mono flex-nowrap overflow-hidden">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <Link
              href="/workspace"
              className="text-text-muted hover:text-foreground transition-colors"
            >
              Studio
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;

          // Look up friendly label from navigation items if available
          const matchingItem = ALL_NAVIGATION_ITEMS.find((item) => item.href === href);
          const rawLabel = matchingItem?.label ?? segment.replace(/-/g, " ");
          const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator className="text-text-disabled">
                <ChevronRightIcon className="h-3 w-3" />
              </BreadcrumbSeparator>

              <BreadcrumbItem className="truncate min-w-0">
                {isLast ? (
                  <BreadcrumbPage className="text-foreground font-semibold truncate max-w-[160px] sm:max-w-[240px]">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={href}
                      className="text-text-muted hover:text-foreground transition-colors truncate max-w-[120px]"
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
