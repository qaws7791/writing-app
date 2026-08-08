import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

function RubricEditor({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="rubric-editor"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  )
}

function RubricEditorHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="rubric-editor-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function RubricEditorTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rubric-editor-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function RubricEditorVersion({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="rubric-editor-version"
      className={cn(
        "inline-flex items-center rounded-full border border-border/80 bg-card px-2.5 py-0.5 text-[11px] font-medium tabular-nums tracking-[0.02em] text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function RubricEditorList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="rubric-editor-list"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

const rubricEditorCriterionVariants = cva(
  "flex flex-col gap-3 rounded-2xl border border-border/70 bg-card px-3.5 py-3",
  {
    variants: {
      expanded: {
        true: "border-foreground/12",
        false: "",
      },
    },
    defaultVariants: {
      expanded: false,
    },
  }
)

function RubricEditorCriterion({
  className,
  expanded = false,
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof rubricEditorCriterionVariants> & {
    expanded?: boolean
  }) {
  return (
    <li
      data-slot="rubric-editor-criterion"
      data-expanded={expanded || undefined}
      className={cn(rubricEditorCriterionVariants({ expanded }), className)}
      {...props}
    >
      {children}
    </li>
  )
}

function RubricEditorCriterionHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rubric-editor-criterion-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function RubricEditorCriterionLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rubric-editor-criterion-label"
      className={cn(
        "text-sm font-medium tracking-[-0.01em] text-pretty",
        className
      )}
      {...props}
    />
  )
}

function RubricEditorWeight({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="rubric-editor-weight"
      className={cn(
        "shrink-0 text-xs tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function RubricEditorLevels({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="rubric-editor-levels"
      className={cn("grid gap-2 sm:grid-cols-2", className)}
      {...props}
    />
  )
}

const rubricEditorLevelVariants = cva(
  "flex flex-col gap-1 rounded-xl border px-3 py-2.5",
  {
    variants: {
      tier: {
        low: "border-border/70 bg-muted/30",
        mid: "border-border/70 bg-card",
        high: "border-foreground/12 bg-foreground/[0.03] dark:bg-foreground/[0.05]",
      },
    },
    defaultVariants: {
      tier: "mid",
    },
  }
)

function RubricEditorLevel({
  className,
  tier = "mid",
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof rubricEditorLevelVariants> & {
    tier?: "low" | "mid" | "high"
  }) {
  return (
    <li
      data-slot="rubric-editor-level"
      data-tier={tier}
      className={cn(rubricEditorLevelVariants({ tier }), className)}
      {...props}
    >
      {children}
    </li>
  )
}

function RubricEditorLevelLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rubric-editor-level-label"
      className={cn(
        "text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase",
        className
      )}
      {...props}
    />
  )
}

function RubricEditorLevelDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="rubric-editor-level-description"
      className={cn(
        "text-xs leading-5 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function RubricEditorExample({
  className,
  ...props
}: React.ComponentProps<"blockquote">) {
  return (
    <blockquote
      data-slot="rubric-editor-example"
      className={cn(
        "rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-xs leading-5 text-pretty italic text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function RubricEditorActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rubric-editor-actions"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    />
  )
}

export {
  RubricEditor,
  RubricEditorHeader,
  RubricEditorTitle,
  RubricEditorVersion,
  RubricEditorList,
  RubricEditorCriterion,
  RubricEditorCriterionHeader,
  RubricEditorCriterionLabel,
  RubricEditorWeight,
  RubricEditorLevels,
  RubricEditorLevel,
  RubricEditorLevelLabel,
  RubricEditorLevelDescription,
  RubricEditorExample,
  RubricEditorActions,
  rubricEditorCriterionVariants,
  rubricEditorLevelVariants,
}
