"use client";

import * as React from "react";

import { cn } from "@/registry/luma/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/luma/ui/tabs";

function Compare({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="compare" className={cn("flex w-full flex-col gap-5", className)} {...props} />
  );
}

function CompareVersions({ className, ...props }: React.ComponentProps<typeof Tabs>) {
  return <Tabs data-slot="compare-versions" className={cn("w-full gap-4", className)} {...props} />;
}

function CompareVersionList({ className, ...props }: React.ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      data-slot="compare-version-list"
      className={cn("w-full justify-start sm:w-fit", className)}
      {...props}
    />
  );
}

function CompareVersion({ className, ...props }: React.ComponentProps<typeof TabsTrigger>) {
  return <TabsTrigger data-slot="compare-version" className={cn(className)} {...props} />;
}

function ComparePanel({ className, ...props }: React.ComponentProps<typeof TabsContent>) {
  return (
    <TabsContent
      data-slot="compare-panel"
      className={cn(
        "rounded-4xl border border-border/80 bg-card px-5 py-5 text-base leading-7 text-pretty shadow-2xs sm:px-6 sm:py-6",
        className,
      )}
      {...props}
    />
  );
}

export { Compare, CompareVersions, CompareVersionList, CompareVersion, ComparePanel };
