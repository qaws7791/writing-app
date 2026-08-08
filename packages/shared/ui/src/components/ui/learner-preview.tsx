import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type LearnerPreviewDeviceKind = "mobile" | "desktop"
type LearnerPreviewPersonaKind = "novice" | "fluent"
type LearnerPreviewScenarioKind = "correct" | "incorrect" | "offline"

const LEARNER_PREVIEW_DEVICE_LABELS: Record<LearnerPreviewDeviceKind, string> =
  {
    mobile: "모바일",
    desktop: "데스크톱",
  }

const LEARNER_PREVIEW_PERSONA_LABELS: Record<
  LearnerPreviewPersonaKind,
  string
> = {
  novice: "초급",
  fluent: "숙련",
}

const LEARNER_PREVIEW_SCENARIO_LABELS: Record<
  LearnerPreviewScenarioKind,
  string
> = {
  correct: "정답",
  incorrect: "오답",
  offline: "오프라인",
}

function LearnerPreview({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="learner-preview"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  )
}

function LearnerPreviewHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="learner-preview-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function LearnerPreviewTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learner-preview-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function LearnerPreviewToolbar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learner-preview-toolbar"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

const learnerPreviewToggleVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] transition-colors",
  {
    variants: {
      active: {
        true: "border-foreground/15 bg-foreground/[0.04] text-foreground dark:bg-foreground/[0.06]",
        false:
          "border-border/70 bg-card text-muted-foreground hover:bg-muted/40",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
)

function LearnerPreviewDevice({
  className,
  device = "desktop",
  active = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof learnerPreviewToggleVariants> & {
    device?: LearnerPreviewDeviceKind
    active?: boolean
  }) {
  return (
    <button
      type="button"
      data-slot="learner-preview-device"
      data-device={device}
      data-active={active || undefined}
      aria-pressed={active}
      className={cn(learnerPreviewToggleVariants({ active }), className)}
      {...props}
    >
      {children ?? LEARNER_PREVIEW_DEVICE_LABELS[device]}
    </button>
  )
}

function LearnerPreviewPersona({
  className,
  persona = "novice",
  active = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof learnerPreviewToggleVariants> & {
    persona?: LearnerPreviewPersonaKind
    active?: boolean
  }) {
  return (
    <button
      type="button"
      data-slot="learner-preview-persona"
      data-persona={persona}
      data-active={active || undefined}
      aria-pressed={active}
      className={cn(learnerPreviewToggleVariants({ active }), className)}
      {...props}
    >
      {children ?? LEARNER_PREVIEW_PERSONA_LABELS[persona]}
    </button>
  )
}

function LearnerPreviewState({
  className,
  scenario = "correct",
  active = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof learnerPreviewToggleVariants> & {
    scenario?: LearnerPreviewScenarioKind
    active?: boolean
  }) {
  return (
    <button
      type="button"
      data-slot="learner-preview-state"
      data-scenario={scenario}
      data-active={active || undefined}
      aria-pressed={active}
      className={cn(learnerPreviewToggleVariants({ active }), className)}
      {...props}
    >
      {children ?? LEARNER_PREVIEW_SCENARIO_LABELS[scenario]}
    </button>
  )
}

const learnerPreviewStageVariants = cva(
  "relative overflow-hidden rounded-2xl border border-border/70 bg-muted/20",
  {
    variants: {
      device: {
        mobile: "mx-auto w-full max-w-[22rem]",
        desktop: "w-full",
      },
    },
    defaultVariants: {
      device: "desktop",
    },
  }
)

function LearnerPreviewStage({
  className,
  device = "desktop",
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof learnerPreviewStageVariants> & {
    device?: LearnerPreviewDeviceKind
  }) {
  return (
    <div
      data-slot="learner-preview-stage"
      data-device={device}
      className={cn(learnerPreviewStageVariants({ device }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

function LearnerPreviewFrame({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learner-preview-frame"
      className={cn("min-h-80 w-full", className)}
      {...props}
    />
  )
}

export {
  LearnerPreview,
  LearnerPreviewHeader,
  LearnerPreviewTitle,
  LearnerPreviewToolbar,
  LearnerPreviewDevice,
  LearnerPreviewPersona,
  LearnerPreviewState,
  LearnerPreviewStage,
  LearnerPreviewFrame,
  learnerPreviewToggleVariants,
  learnerPreviewStageVariants,
  LEARNER_PREVIEW_DEVICE_LABELS,
  LEARNER_PREVIEW_PERSONA_LABELS,
  LEARNER_PREVIEW_SCENARIO_LABELS,
  type LearnerPreviewDeviceKind,
  type LearnerPreviewPersonaKind,
  type LearnerPreviewScenarioKind,
}
