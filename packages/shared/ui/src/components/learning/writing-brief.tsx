import * as React from "react"

import { cn } from "#ui/lib/utils"

function WritingBrief({
  className,
  ...props
}: React.ComponentProps<"article">) {
  return (
    <article
      data-slot="writing-brief"
      className={cn("flex w-full flex-col gap-5", className)}
      {...props}
    />
  )
}

function WritingBriefHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="writing-brief-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function WritingBriefTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="writing-brief-title"
      className={cn(
        "text-lg font-semibold tracking-[-0.02em] text-balance sm:text-xl",
        className
      )}
      {...props}
    />
  )
}

function WritingBriefLead({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="writing-brief-lead"
      className={cn(
        "text-sm leading-6 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function WritingBriefFacts({
  className,
  ...props
}: React.ComponentProps<"dl">) {
  return (
    <dl
      data-slot="writing-brief-facts"
      className={cn(
        "grid grid-cols-[minmax(5rem,auto)_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-2xl border border-border/70 bg-card px-3.5 py-3",
        className
      )}
      {...props}
    />
  )
}

function WritingBriefFact({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="writing-brief-fact"
      className={cn(
        "col-span-2 grid grid-cols-subgrid items-baseline gap-x-4 gap-y-1",
        className
      )}
      {...props}
    />
  )
}

function WritingBriefSection({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="writing-brief-section"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function WritingBriefSectionTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="writing-brief-section-title"
      className={cn(
        "text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase",
        className
      )}
      {...props}
    />
  )
}

function WritingBriefCriteria({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="writing-brief-criteria"
      className={cn(
        "flex list-disc flex-col gap-1.5 pl-4 text-sm leading-6",
        className
      )}
      {...props}
    />
  )
}

function WritingBriefCriterion({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="writing-brief-criterion"
      className={cn("text-pretty", className)}
      {...props}
    />
  )
}

function WritingBriefRequirement({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="writing-brief-requirement"
      className={cn(
        "rounded-2xl border border-border/70 bg-muted/30 px-3.5 py-2.5 text-xs leading-5 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  WritingBrief,
  WritingBriefHeader,
  WritingBriefTitle,
  WritingBriefLead,
  WritingBriefFacts,
  WritingBriefFact,
  WritingBriefSection,
  WritingBriefSectionTitle,
  WritingBriefCriteria,
  WritingBriefCriterion,
  WritingBriefRequirement,
}
