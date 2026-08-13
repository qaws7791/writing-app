import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

const insightVariants = cva(
  "group/insight flex w-full flex-col gap-2 rounded-3xl border px-4 py-4 text-left text-sm",
  {
    variants: {
      tone: {
        neutral: "border-border/80 bg-card text-card-foreground",
        think: "border-info/25 bg-info/8 text-foreground",
        correct: "border-success/25 bg-success/8 text-success",
        incorrect: "border-destructive/25 bg-destructive/6 text-destructive",
        coaching: "border-border/80 bg-card text-card-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

function Insight({
  className,
  tone = "neutral",
  ...props
}: React.ComponentProps<"aside"> & VariantProps<typeof insightVariants>) {
  return (
    <aside
      data-slot="insight"
      data-tone={tone}
      className={cn(insightVariants({ tone }), className)}
      {...props}
    />
  )
}

function InsightEyebrow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="insight-eyebrow"
      className={cn(
        "text-xs font-medium text-muted-foreground group-data-[tone=think]/insight:text-info group-data-[tone=incorrect]/insight:text-destructive/75",
        className
      )}
      {...props}
    />
  )
}

function InsightTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="insight-title"
      className={cn("font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function InsightDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="insight-description"
      className={cn(
        "text-sm leading-6 text-pretty text-muted-foreground group-data-[tone=incorrect]/insight:text-destructive/85 [&_p:not(:last-child)]:mb-3",
        className
      )}
      {...props}
    />
  )
}

function InsightList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="insight-list"
      className={cn(
        "mt-1 flex list-disc flex-col gap-1.5 pl-4 text-sm leading-6",
        className
      )}
      {...props}
    />
  )
}

function InsightItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="insight-item"
      className={cn("text-pretty", className)}
      {...props}
    />
  )
}

export {
  Insight,
  InsightDescription,
  InsightEyebrow,
  InsightItem,
  InsightList,
  InsightTitle,
  insightVariants,
}
