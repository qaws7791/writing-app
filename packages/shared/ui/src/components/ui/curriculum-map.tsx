import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type CurriculumMapNodeKind = "objective" | "concept" | "lesson" | "checkpoint"

const CURRICULUM_MAP_NODE_KIND_LABELS: Record<CurriculumMapNodeKind, string> = {
  objective: "목표",
  concept: "개념",
  lesson: "레슨",
  checkpoint: "체크포인트",
}

function CurriculumMap({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="curriculum-map"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  )
}

function CurriculumMapHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="curriculum-map-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function CurriculumMapTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="curriculum-map-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function CurriculumMapHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="curriculum-map-hint"
      className={cn(
        "text-xs leading-5 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CurriculumMapList({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="curriculum-map-list"
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-border/70 bg-muted/20 px-3.5 py-3",
        className
      )}
      {...props}
    />
  )
}

function CurriculumMapLink({
  className,
  children,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="curriculum-map-link"
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2",
        className
      )}
      {...props}
    >
      {children}
    </li>
  )
}

const curriculumMapNodeVariants = cva(
  "flex flex-col gap-0.5 rounded-2xl border px-3 py-2.5",
  {
    variants: {
      kind: {
        objective: "border-foreground/20 bg-card",
        concept: "border-border/70 bg-card",
        lesson: "border-border/70 bg-muted/30",
        checkpoint: "border-border/70 bg-card",
      },
    },
    defaultVariants: {
      kind: "concept",
    },
  }
)

function CurriculumMapNode({
  className,
  kind = "concept",
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof curriculumMapNodeVariants> & {
    kind?: CurriculumMapNodeKind
  }) {
  return (
    <div
      data-slot="curriculum-map-node"
      data-kind={kind}
      className={cn(curriculumMapNodeVariants({ kind }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

function CurriculumMapNodeLabel({
  className,
  kind = "concept",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  kind?: CurriculumMapNodeKind
}) {
  return (
    <div
      data-slot="curriculum-map-node-label"
      data-kind={kind}
      className={cn(
        "text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase",
        className
      )}
      {...props}
    >
      {children ?? CURRICULUM_MAP_NODE_KIND_LABELS[kind]}
    </div>
  )
}

function CurriculumMapNodeBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="curriculum-map-node-body"
      className={cn(
        "text-sm leading-6 text-pretty tracking-[-0.01em]",
        className
      )}
      {...props}
    />
  )
}

function CurriculumMapEdge({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="curriculum-map-edge"
      role="presentation"
      className={cn(
        "flex items-center justify-center text-muted-foreground before:h-px before:min-w-3 before:flex-1 before:bg-border/80 after:h-px after:min-w-3 after:flex-1 after:bg-border/80",
        className
      )}
      {...props}
    >
      <span className="shrink-0 px-1 text-[10px] font-medium tracking-[0.04em] uppercase">
        {children}
      </span>
    </div>
  )
}

const curriculumMapGapVariants = cva(
  "col-span-3 flex items-start gap-2 rounded-2xl border px-3 py-2.5 text-xs leading-5",
  {
    variants: {
      kind: {
        missing:
          "border-foreground/15 bg-foreground/[0.03] text-foreground/80 dark:bg-foreground/[0.05]",
        excess: "border-border/70 bg-muted/40 text-muted-foreground",
      },
    },
    defaultVariants: {
      kind: "missing",
    },
  }
)

function CurriculumMapGap({
  className,
  kind = "missing",
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof curriculumMapGapVariants> & {
    kind?: "missing" | "excess"
  }) {
  return (
    <li
      data-slot="curriculum-map-gap"
      data-kind={kind}
      className={cn(curriculumMapGapVariants({ kind }), className)}
      {...props}
    >
      {children}
    </li>
  )
}

export {
  CurriculumMap,
  CurriculumMapHeader,
  CurriculumMapTitle,
  CurriculumMapHint,
  CurriculumMapList,
  CurriculumMapLink,
  CurriculumMapNode,
  CurriculumMapNodeLabel,
  CurriculumMapNodeBody,
  CurriculumMapEdge,
  CurriculumMapGap,
  curriculumMapNodeVariants,
  curriculumMapGapVariants,
  CURRICULUM_MAP_NODE_KIND_LABELS,
  type CurriculumMapNodeKind,
}
