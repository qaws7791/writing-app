import * as React from "react"

import { cn } from "#ui/lib/utils"

function Compare({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compare"
      className={cn("grid w-full grid-cols-1 gap-3 sm:grid-cols-2", className)}
      {...props}
    />
  )
}

function CompareVersion({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="compare-version"
      className={cn(
        "flex flex-col gap-2 rounded-3xl border border-border/80 bg-card px-5 py-4 text-base leading-7 text-pretty",
        className
      )}
      {...props}
    />
  )
}

function CompareVersionLabel({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="compare-version-label"
      className={cn("text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  )
}

function CompareVersionText({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="compare-version-text"
      className={cn("text-base leading-7 text-pretty", className)}
      {...props}
    />
  )
}

function CompareMark({ className, ...props }: React.ComponentProps<"mark">) {
  return (
    <mark
      data-slot="compare-mark"
      className={cn(
        "rounded-sm bg-highlight-1 px-0.5 text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Compare,
  CompareMark,
  CompareVersion,
  CompareVersionLabel,
  CompareVersionText,
}
