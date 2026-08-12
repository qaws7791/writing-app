import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type MistakePatternState = "emerging" | "recurring" | "resolved"

const MISTAKE_PATTERN_STATE_LABELS: Record<MistakePatternState, string> = {
  emerging: "새로 발견",
  recurring: "반복됨",
  resolved: "개선됨",
}

function MistakeJournal({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="mistake-journal"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  )
}

function MistakeJournalHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="mistake-journal-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function MistakeJournalTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="mistake-journal-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function MistakeJournalMeta({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="mistake-journal-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function MistakeJournalList({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="mistake-journal-list"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

const mistakePatternVariants = cva(
  "flex flex-col gap-2 rounded-2xl border border-border/70 bg-card px-3.5 py-3",
  {
    variants: {
      state: {
        emerging: "",
        recurring: "border-foreground/15",
        resolved: "opacity-80",
      },
    },
    defaultVariants: {
      state: "emerging",
    },
  }
)

function MistakePattern({
  className,
  state = "emerging",
  count,
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof mistakePatternVariants> & {
    state?: MistakePatternState
    count?: number
  }) {
  return (
    <li
      data-slot="mistake-pattern"
      data-state={state}
      data-count={count}
      className={cn(mistakePatternVariants({ state }), className)}
      {...props}
    >
      {children}
    </li>
  )
}

function MistakePatternLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="mistake-pattern-label"
      className={cn(
        "text-sm font-medium tracking-[-0.01em] text-pretty",
        className
      )}
      {...props}
    />
  )
}

function MistakePatternCount({
  className,
  count,
  children,
  ...props
}: React.ComponentProps<"span"> & {
  count?: number
}) {
  return (
    <span
      data-slot="mistake-pattern-count"
      className={cn(
        "inline-flex items-center rounded-full border border-border/80 bg-muted/50 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    >
      {children ?? (count != null ? `${count}회` : undefined)}
    </span>
  )
}

function MistakePatternDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="mistake-pattern-description"
      className={cn(
        "text-xs leading-5 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function MistakePatternActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="mistake-pattern-actions"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

export {
  MistakeJournal,
  MistakeJournalHeader,
  MistakeJournalTitle,
  MistakeJournalMeta,
  MistakeJournalList,
  MistakePattern,
  MistakePatternLabel,
  MistakePatternCount,
  MistakePatternDescription,
  MistakePatternActions,
  mistakePatternVariants,
  MISTAKE_PATTERN_STATE_LABELS,
  type MistakePatternState,
}
