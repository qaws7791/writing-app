import * as React from "react"

import { cn } from "#ui/lib/utils"

function LearningAnalytics({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="learning-analytics"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  )
}

function LearningAnalyticsHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="learning-analytics-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function LearningAnalyticsTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learning-analytics-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function LearningAnalyticsMeta({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="learning-analytics-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function LearningAnalyticsGrid({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learning-analytics-grid"
      className={cn(
        "grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-2",
        className
      )}
      {...props}
    />
  )
}

function LearningAnalyticsMetric({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learning-analytics-metric"
      className={cn(
        "flex flex-col gap-1 rounded-2xl border border-border/70 bg-card px-3.5 py-3",
        className
      )}
      {...props}
    />
  )
}

function LearningAnalyticsMetricLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learning-analytics-metric-label"
      className={cn("text-[11px] font-medium text-muted-foreground", className)}
      {...props}
    />
  )
}

function LearningAnalyticsMetricValue({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learning-analytics-metric-value"
      className={cn(
        "text-lg font-semibold tabular-nums tracking-[-0.02em]",
        className
      )}
      {...props}
    />
  )
}

function LearningAnalyticsMetricHint({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="learning-analytics-metric-hint"
      className={cn("text-[11px] leading-4 text-muted-foreground", className)}
      {...props}
    />
  )
}

function LearningAnalyticsSeries({
  className,
  ...props
}: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="learning-analytics-series"
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    />
  )
}

function LearningAnalyticsRow({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="learning-analytics-row"
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl px-2.5 py-2 text-sm hover:bg-muted/40",
        className
      )}
      {...props}
    />
  )
}

export {
  LearningAnalytics,
  LearningAnalyticsHeader,
  LearningAnalyticsTitle,
  LearningAnalyticsMeta,
  LearningAnalyticsGrid,
  LearningAnalyticsMetric,
  LearningAnalyticsMetricLabel,
  LearningAnalyticsMetricValue,
  LearningAnalyticsMetricHint,
  LearningAnalyticsSeries,
  LearningAnalyticsRow,
}
