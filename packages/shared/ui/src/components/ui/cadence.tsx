"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { MinusSignIcon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "#ui/lib/utils"

type CadenceDayState = "practiced" | "rest" | "today" | "upcoming"

const CADENCE_STATE_LABELS: Record<CadenceDayState, string> = {
  practiced: "학습함",
  rest: "휴식",
  today: "오늘",
  upcoming: "예정",
}

function Cadence({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="cadence"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  )
}

function CadenceHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="cadence-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function CadenceTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="cadence-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function CadenceSummary({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="cadence-summary"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function CadenceWeek({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="cadence-week"
      className={cn("grid grid-cols-7 gap-2", className)}
      {...props}
    />
  )
}

const cadenceDayVariants = cva(
  "flex flex-col items-center gap-1.5 text-center outline-none",
  {
    variants: {
      state: {
        practiced: "",
        rest: "",
        today: "",
        upcoming: "",
      },
    },
    defaultVariants: {
      state: "upcoming",
    },
  }
)

const cadenceMarkVariants = cva(
  "flex size-8 items-center justify-center rounded-full border transition-[background-color,border-color,color,box-shadow] duration-125 [&>svg]:size-3.5",
  {
    variants: {
      state: {
        practiced: "border-foreground/20 bg-foreground text-background",
        rest: "border-border/80 bg-muted/30 text-muted-foreground",
        today:
          "border-primary/40 bg-primary/10 text-foreground ring-3 ring-primary/12",
        upcoming: "border-border/60 bg-transparent text-muted-foreground/50",
      },
    },
    defaultVariants: {
      state: "upcoming",
    },
  }
)

function CadenceDayMark({ state }: { state: CadenceDayState }) {
  switch (state) {
    case "practiced":
      return (
        <HugeiconsIcon
          icon={Tick02Icon}
          strokeWidth={2.25}
          aria-hidden="true"
        />
      )
    case "rest":
      return (
        <HugeiconsIcon
          icon={MinusSignIcon}
          strokeWidth={2}
          aria-hidden="true"
        />
      )
    case "today":
      return (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-foreground/55"
        />
      )
    case "upcoming":
    default:
      return null
  }
}

function CadenceDay({
  className,
  state = "upcoming",
  label,
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof cadenceDayVariants> & {
    state?: CadenceDayState
    label: string
  }) {
  const stateLabel = CADENCE_STATE_LABELS[state]

  return (
    <li
      data-slot="cadence-day"
      data-state={state}
      className={cn(cadenceDayVariants({ state }), className)}
      {...props}
    >
      <span className="text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
        {label}
      </span>
      <span
        data-slot="cadence-mark"
        aria-label={`${label}, ${stateLabel}`}
        className={cn(cadenceMarkVariants({ state }))}
      >
        {children ?? <CadenceDayMark state={state} />}
      </span>
    </li>
  )
}

function CadenceHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="cadence-hint"
      className={cn(
        "text-xs leading-5 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Cadence,
  CadenceHeader,
  CadenceTitle,
  CadenceSummary,
  CadenceWeek,
  CadenceDay,
  CadenceHint,
  cadenceDayVariants,
  cadenceMarkVariants,
  type CadenceDayState,
}
