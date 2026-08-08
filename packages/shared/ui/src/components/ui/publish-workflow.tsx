import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type PublishWorkflowStepState =
  | "draft"
  | "review"
  | "scheduled"
  | "published"
  | "rolled-back"

type PublishWorkflowEnv = "sandbox" | "test" | "preview" | "live"

const PUBLISH_WORKFLOW_STEP_LABELS: Record<PublishWorkflowStepState, string> = {
  draft: "초안",
  review: "검토",
  scheduled: "예약됨",
  published: "게시됨",
  "rolled-back": "롤백됨",
}

const PUBLISH_WORKFLOW_ENV_LABELS: Record<PublishWorkflowEnv, string> = {
  sandbox: "Sandbox",
  test: "Test",
  preview: "Preview",
  live: "Live",
}

function PublishWorkflow({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="publish-workflow"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  )
}

function PublishWorkflowHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="publish-workflow-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function PublishWorkflowTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="publish-workflow-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function PublishWorkflowSteps({
  className,
  ...props
}: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="publish-workflow-steps"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      {...props}
    />
  )
}

const publishWorkflowStepVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.02em]",
  {
    variants: {
      state: {
        draft: "border-border/80 bg-card text-muted-foreground",
        review: "border-border/80 bg-card text-muted-foreground",
        scheduled: "border-border/80 bg-card text-foreground/70",
        published: "border-foreground/20 bg-foreground text-background",
        "rolled-back": "border-border/80 bg-muted/50 text-muted-foreground",
      },
      active: {
        true: "ring-1 ring-foreground/15",
        false: "",
      },
    },
    defaultVariants: {
      state: "draft",
      active: false,
    },
  }
)

function PublishWorkflowStep({
  className,
  state = "draft",
  active = false,
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof publishWorkflowStepVariants> & {
    state?: PublishWorkflowStepState
    active?: boolean
  }) {
  return (
    <li
      data-slot="publish-workflow-step"
      data-state={state}
      data-active={active || undefined}
      aria-current={active ? "step" : undefined}
      className={cn(publishWorkflowStepVariants({ state, active }), className)}
      {...props}
    >
      {children ?? PUBLISH_WORKFLOW_STEP_LABELS[state]}
    </li>
  )
}

const publishWorkflowEnvironmentVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-[0.04em] uppercase",
  {
    variants: {
      env: {
        sandbox: "border-border/80 bg-muted/40 text-muted-foreground",
        test: "border-border/80 bg-card text-muted-foreground",
        preview: "border-foreground/15 bg-foreground/[0.04] text-foreground/80",
        live: "border-foreground/20 bg-foreground text-background",
      },
    },
    defaultVariants: {
      env: "sandbox",
    },
  }
)

function PublishWorkflowEnvironment({
  className,
  env = "sandbox",
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof publishWorkflowEnvironmentVariants> & {
    env?: PublishWorkflowEnv
  }) {
  return (
    <span
      data-slot="publish-workflow-environment"
      data-env={env}
      className={cn(publishWorkflowEnvironmentVariants({ env }), className)}
      {...props}
    >
      {children ?? PUBLISH_WORKFLOW_ENV_LABELS[env]}
    </span>
  )
}

function PublishWorkflowMeta({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="publish-workflow-meta"
      className={cn("text-xs leading-5 text-muted-foreground", className)}
      {...props}
    />
  )
}

function PublishWorkflowActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="publish-workflow-actions"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    />
  )
}

export {
  PublishWorkflow,
  PublishWorkflowHeader,
  PublishWorkflowTitle,
  PublishWorkflowSteps,
  PublishWorkflowStep,
  PublishWorkflowEnvironment,
  PublishWorkflowMeta,
  PublishWorkflowActions,
  publishWorkflowStepVariants,
  publishWorkflowEnvironmentVariants,
  PUBLISH_WORKFLOW_STEP_LABELS,
  PUBLISH_WORKFLOW_ENV_LABELS,
  type PublishWorkflowStepState,
  type PublishWorkflowEnv,
}
