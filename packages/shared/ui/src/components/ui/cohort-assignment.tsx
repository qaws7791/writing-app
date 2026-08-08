import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type CohortTargetKind = "course" | "lesson" | "writing"

const COHORT_TARGET_KIND_LABELS: Record<CohortTargetKind, string> = {
  course: "코스",
  lesson: "레슨",
  writing: "글쓰기",
}

function CohortAssignment({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="cohort-assignment"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  )
}

function CohortAssignmentHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="cohort-assignment-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function CohortAssignmentTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="cohort-assignment-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function CohortAssignmentMeta({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="cohort-assignment-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function CohortAssignmentMembers({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="cohort-assignment-members"
      className={cn("flex flex-wrap gap-1.5", className)}
      {...props}
    />
  )
}

function CohortMember({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="cohort-member"
      className={cn(
        "inline-flex items-center rounded-full border border-border/80 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CohortAssignmentTargets({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="cohort-assignment-targets"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

const cohortTargetVariants = cva(
  "flex items-baseline justify-between gap-3 rounded-2xl border border-border/70 bg-card px-3.5 py-3",
  {
    variants: {
      kind: {
        course: "",
        lesson: "",
        writing: "",
      },
    },
    defaultVariants: {
      kind: "course",
    },
  }
)

function CohortTarget({
  className,
  kind = "course",
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof cohortTargetVariants> & {
    kind?: CohortTargetKind
  }) {
  return (
    <li
      data-slot="cohort-target"
      data-kind={kind}
      className={cn(cohortTargetVariants({ kind }), className)}
      {...props}
    >
      {children}
    </li>
  )
}

function CohortTargetLabel({
  className,
  kind,
  children,
  ...props
}: React.ComponentProps<"span"> & {
  kind?: CohortTargetKind
}) {
  return (
    <span
      data-slot="cohort-target-label"
      data-kind={kind}
      className={cn("text-[11px] text-muted-foreground", className)}
      {...props}
    >
      {children ?? (kind ? COHORT_TARGET_KIND_LABELS[kind] : undefined)}
    </span>
  )
}

function CohortTargetTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="cohort-target-title"
      className={cn(
        "text-sm font-medium tracking-[-0.01em] text-pretty",
        className
      )}
      {...props}
    />
  )
}

function CohortAssignmentDeadline({
  className,
  ...props
}: React.ComponentProps<"time">) {
  return (
    <time
      data-slot="cohort-assignment-deadline"
      className={cn(
        "inline-flex items-center rounded-full border border-border/80 bg-card px-2.5 py-1 text-xs tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CohortAssignmentExceptions({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="cohort-assignment-exceptions"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function CohortAssignmentException({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="cohort-assignment-exception"
      className={cn(
        "flex items-baseline justify-between gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-3.5 py-2.5 text-sm",
        className
      )}
      {...props}
    />
  )
}

function CohortAssignmentActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="cohort-assignment-actions"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    />
  )
}

export {
  CohortAssignment,
  CohortAssignmentHeader,
  CohortAssignmentTitle,
  CohortAssignmentMeta,
  CohortAssignmentMembers,
  CohortMember,
  CohortAssignmentTargets,
  CohortTarget,
  CohortTargetLabel,
  CohortTargetTitle,
  CohortAssignmentDeadline,
  CohortAssignmentExceptions,
  CohortAssignmentException,
  CohortAssignmentActions,
  cohortTargetVariants,
  COHORT_TARGET_KIND_LABELS,
  type CohortTargetKind,
}
