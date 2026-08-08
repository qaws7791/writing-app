import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

function Standing({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="standing"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  )
}

function StandingHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="standing-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function StandingTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="standing-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function StandingMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="standing-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function StandingList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="standing-list"
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    />
  )
}

const standingRowVariants = cva(
  "grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-2.5 py-2 text-sm",
  {
    variants: {
      you: {
        true: "bg-foreground/[0.04] ring-1 ring-foreground/10 dark:bg-foreground/[0.06]",
        false: "hover:bg-muted/40",
      },
    },
    defaultVariants: {
      you: false,
    },
  }
)

function StandingRow({
  className,
  rank,
  you = false,
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof standingRowVariants> & {
    rank: number
    you?: boolean
  }) {
  return (
    <li
      data-slot="standing-row"
      data-you={you || undefined}
      aria-current={you ? "true" : undefined}
      className={cn(standingRowVariants({ you }), className)}
      {...props}
    >
      <span
        data-slot="standing-rank"
        className="text-xs font-medium tabular-nums text-muted-foreground"
      >
        {rank}
      </span>
      {children}
    </li>
  )
}

function StandingName({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="standing-name"
      className={cn(
        "min-w-0 truncate font-medium tracking-[-0.01em]",
        className
      )}
      {...props}
    />
  )
}

function StandingMetric({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="standing-metric"
      className={cn(
        "shrink-0 text-xs tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function StandingHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="standing-hint"
      className={cn(
        "text-xs leading-5 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Standing,
  StandingHeader,
  StandingTitle,
  StandingMeta,
  StandingList,
  StandingRow,
  StandingName,
  StandingMetric,
  StandingHint,
  standingRowVariants,
}
