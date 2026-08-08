import * as React from "react";

import { cn } from "@/registry/luma/lib/utils";

function WritingAnalytics({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="writing-analytics"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  );
}

function WritingAnalyticsHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="writing-analytics-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  );
}

function WritingAnalyticsTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="writing-analytics-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function WritingAnalyticsMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="writing-analytics-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  );
}

function WritingAnalyticsGrid({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="writing-analytics-grid"
      className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}
      {...props}
    />
  );
}

function WritingAnalyticsMetric({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="writing-analytics-metric"
      className={cn(
        "flex flex-col gap-1 rounded-2xl border border-border/70 bg-card px-3.5 py-3",
        className,
      )}
      {...props}
    />
  );
}

function WritingAnalyticsMetricLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="writing-analytics-metric-label"
      className={cn("text-[11px] font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

function WritingAnalyticsMetricValue({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="writing-analytics-metric-value"
      className={cn("text-lg font-semibold tabular-nums tracking-[-0.02em]", className)}
      {...props}
    />
  );
}

function WritingAnalyticsCriteria({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="writing-analytics-criteria"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

function WritingAnalyticsCriterion({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="writing-analytics-criterion"
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 rounded-2xl px-2.5 py-2 text-sm hover:bg-muted/40",
        className,
      )}
      {...props}
    />
  );
}

function WritingAnalyticsGenre({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="writing-analytics-genre"
      className={cn(
        "inline-flex items-center rounded-full border border-border/80 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function WritingAnalyticsHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="writing-analytics-hint"
      className={cn("text-xs leading-5 text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  WritingAnalytics,
  WritingAnalyticsHeader,
  WritingAnalyticsTitle,
  WritingAnalyticsMeta,
  WritingAnalyticsGrid,
  WritingAnalyticsMetric,
  WritingAnalyticsMetricLabel,
  WritingAnalyticsMetricValue,
  WritingAnalyticsCriteria,
  WritingAnalyticsCriterion,
  WritingAnalyticsGenre,
  WritingAnalyticsHint,
};
