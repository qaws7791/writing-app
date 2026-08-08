import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type ItemAnalysisFlagKind =
  | "high-dropout"
  | "hint-heavy"
  | "retry-heavy"
  | "distractor-bias"

const ITEM_ANALYSIS_FLAG_LABELS: Record<ItemAnalysisFlagKind, string> = {
  "high-dropout": "높은 이탈",
  "hint-heavy": "힌트 과다",
  "retry-heavy": "재시도 과다",
  "distractor-bias": "오답 편향",
}

function ItemAnalysis({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="item-analysis"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  )
}

function ItemAnalysisHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="item-analysis-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function ItemAnalysisTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-analysis-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function ItemAnalysisMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-analysis-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function ItemAnalysisList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="item-analysis-list"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function ItemAnalysisRow({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="item-analysis-row"
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border/70 bg-card px-3.5 py-3",
        className
      )}
      {...props}
    />
  )
}

function ItemAnalysisPrompt({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-analysis-prompt"
      className={cn(
        "text-sm leading-6 font-medium tracking-[-0.01em] text-pretty",
        className
      )}
      {...props}
    />
  )
}

function ItemAnalysisStats({
  className,
  ...props
}: React.ComponentProps<"dl">) {
  return (
    <dl
      data-slot="item-analysis-stats"
      className={cn("flex flex-wrap gap-x-4 gap-y-2", className)}
      {...props}
    />
  )
}

function ItemAnalysisStat({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-analysis-stat"
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    />
  )
}

function ItemAnalysisStatLabel({
  className,
  ...props
}: React.ComponentProps<"dt">) {
  return (
    <dt
      data-slot="item-analysis-stat-label"
      className={cn("text-[11px] text-muted-foreground", className)}
      {...props}
    />
  )
}

function ItemAnalysisStatValue({
  className,
  ...props
}: React.ComponentProps<"dd">) {
  return (
    <dd
      data-slot="item-analysis-stat-value"
      className={cn("text-sm font-medium tabular-nums", className)}
      {...props}
    />
  )
}

function ItemAnalysisDistractors({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="item-analysis-distractors"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

const itemAnalysisDistractorVariants = cva(
  "flex items-baseline justify-between gap-3 rounded-xl px-2.5 py-1.5 text-sm",
  {
    variants: {
      selected: {
        true: "bg-foreground/[0.04] ring-1 ring-foreground/10",
        false: "hover:bg-muted/40",
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
)

function ItemAnalysisDistractor({
  className,
  selected = false,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof itemAnalysisDistractorVariants>) {
  return (
    <li
      data-slot="item-analysis-distractor"
      data-selected={selected || undefined}
      className={cn(itemAnalysisDistractorVariants({ selected }), className)}
      {...props}
    />
  )
}

function ItemAnalysisFlags({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-analysis-flags"
      className={cn("flex flex-wrap gap-1.5", className)}
      {...props}
    />
  )
}

const itemAnalysisFlagVariants = cva(
  "inline-flex items-center rounded-full border border-border/80 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground",
  {
    variants: {
      flag: {
        "high-dropout": "",
        "hint-heavy": "",
        "retry-heavy": "",
        "distractor-bias": "",
      },
    },
    defaultVariants: {
      flag: "high-dropout",
    },
  }
)

function ItemAnalysisFlag({
  className,
  flag = "high-dropout",
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof itemAnalysisFlagVariants> & {
    flag?: ItemAnalysisFlagKind
  }) {
  return (
    <span
      data-slot="item-analysis-flag"
      data-flag={flag}
      className={cn(itemAnalysisFlagVariants({ flag }), className)}
      {...props}
    >
      {children ?? ITEM_ANALYSIS_FLAG_LABELS[flag]}
    </span>
  )
}

export {
  ItemAnalysis,
  ItemAnalysisHeader,
  ItemAnalysisTitle,
  ItemAnalysisMeta,
  ItemAnalysisList,
  ItemAnalysisRow,
  ItemAnalysisPrompt,
  ItemAnalysisStats,
  ItemAnalysisStat,
  ItemAnalysisStatLabel,
  ItemAnalysisStatValue,
  ItemAnalysisDistractors,
  ItemAnalysisDistractor,
  ItemAnalysisFlags,
  ItemAnalysisFlag,
  itemAnalysisDistractorVariants,
  itemAnalysisFlagVariants,
  ITEM_ANALYSIS_FLAG_LABELS,
  type ItemAnalysisFlagKind,
}
