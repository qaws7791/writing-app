import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type MasteryLevel = "emerging" | "developing" | "secure" | "fluent"

const MASTERY_LEVELS: MasteryLevel[] = [
  "emerging",
  "developing",
  "secure",
  "fluent",
]

const MASTERY_LABELS: Record<MasteryLevel, string> = {
  emerging: "입문",
  developing: "익히는 중",
  secure: "안정",
  fluent: "숙련",
}

function Mastery({
  className,
  level = "emerging",
  ...props
}: React.ComponentProps<"section"> & {
  level?: MasteryLevel
}) {
  return (
    <section
      data-slot="mastery"
      data-level={level}
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  )
}

function MasteryHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="mastery-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function MasteryLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="mastery-label"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function MasteryBadge({
  className,
  level = "emerging",
  children,
  ...props
}: React.ComponentProps<"span"> & {
  level?: MasteryLevel
}) {
  return (
    <span
      data-slot="mastery-badge"
      data-level={level}
      className={cn(
        "inline-flex items-center rounded-full border border-border/80 bg-card px-2.5 py-0.5 text-[11px] font-medium tracking-[0.02em] text-muted-foreground",
        className
      )}
      {...props}
    >
      {children ?? MASTERY_LABELS[level]}
    </span>
  )
}

const masteryStageVariants = cva(
  "h-1.5 min-w-0 flex-1 rounded-full transition-[background-color,opacity] duration-150",
  {
    variants: {
      tone: {
        filled: "bg-foreground",
        current: "bg-foreground/55",
        empty: "bg-secondary",
      },
    },
    defaultVariants: {
      tone: "empty",
    },
  }
)

function MasteryStages({
  className,
  level = "emerging",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof masteryStageVariants> & {
    level?: MasteryLevel
  }) {
  const activeIndex = MASTERY_LEVELS.indexOf(level)

  return (
    <div
      data-slot="mastery-stages"
      role="img"
      aria-label={`숙련도 ${MASTERY_LABELS[level]}, ${activeIndex + 1} / ${MASTERY_LEVELS.length}`}
      className={cn("flex items-center gap-1.5", className)}
      {...props}
    >
      {MASTERY_LEVELS.map((stage, index) => {
        const tone =
          index < activeIndex
            ? "filled"
            : index === activeIndex
              ? "current"
              : "empty"
        return (
          <span
            key={stage}
            data-slot="mastery-stage"
            data-stage={stage}
            data-tone={tone}
            className={cn(masteryStageVariants({ tone }))}
          />
        )
      })}
    </div>
  )
}

function MasteryDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="mastery-description"
      className={cn(
        "text-xs leading-5 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Mastery,
  MasteryHeader,
  MasteryLabel,
  MasteryBadge,
  MasteryStages,
  MasteryDescription,
  masteryStageVariants,
  MASTERY_LEVELS,
  MASTERY_LABELS,
  type MasteryLevel,
}
