import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type SubmissionState =
  | "draft"
  | "submitted"
  | "in-review"
  | "revision-requested"
  | "resubmitted"
  | "graded"

const SUBMISSION_STATE_LABELS: Record<SubmissionState, string> = {
  draft: "작성 중",
  submitted: "제출됨",
  "in-review": "검토 중",
  "revision-requested": "수정 요청",
  resubmitted: "재제출됨",
  graded: "채점 완료",
}

function Submission({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="submission"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  )
}

function SubmissionHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="submission-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function SubmissionTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="submission-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

const submissionStatusVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-[0.02em]",
  {
    variants: {
      state: {
        draft: "border-border/80 bg-card text-muted-foreground",
        submitted: "border-border/80 bg-card text-foreground/70",
        "in-review":
          "border-foreground/15 bg-foreground/[0.04] text-foreground/80",
        "revision-requested":
          "border-destructive/30 bg-destructive/5 text-destructive",
        resubmitted: "border-border/80 bg-card text-foreground/70",
        graded: "border-foreground/15 bg-foreground/[0.04] text-foreground",
      },
    },
    defaultVariants: {
      state: "draft",
    },
  }
)

function SubmissionStatus({
  className,
  state = "draft",
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof submissionStatusVariants> & {
    state?: SubmissionState
  }) {
  return (
    <span
      data-slot="submission-status"
      data-state={state}
      className={cn(submissionStatusVariants({ state }), className)}
      {...props}
    >
      {children ?? SUBMISSION_STATE_LABELS[state]}
    </span>
  )
}

function SubmissionMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="submission-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function SubmissionHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="submission-hint"
      className={cn(
        "text-xs leading-5 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function SubmissionActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="submission-actions"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

export {
  Submission,
  SubmissionHeader,
  SubmissionTitle,
  SubmissionStatus,
  SubmissionMeta,
  SubmissionHint,
  SubmissionActions,
  submissionStatusVariants,
  SUBMISSION_STATE_LABELS,
  type SubmissionState,
}
