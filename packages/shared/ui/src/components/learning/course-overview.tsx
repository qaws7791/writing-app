import * as React from "react"

import { cn } from "#ui/lib/utils"

function CourseOverview({
  className,
  ...props
}: React.ComponentProps<"article">) {
  return (
    <article
      data-slot="course-overview"
      className={cn("flex w-full flex-col gap-8", className)}
      {...props}
    />
  )
}

function CourseOverviewHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="course-overview-header"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  )
}

function CourseOverviewEyebrow({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="course-overview-eyebrow"
      className={cn(
        "text-xs font-medium tracking-[0.04em] text-muted-foreground uppercase",
        className
      )}
      {...props}
    />
  )
}

function CourseOverviewTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="course-overview-title"
      className={cn(
        "text-2xl font-semibold tracking-[-0.025em] text-balance",
        className
      )}
      {...props}
    />
  )
}

function CourseOverviewLead({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="course-overview-lead"
      className={cn(
        "text-sm leading-6 text-pretty text-muted-foreground sm:text-[0.9375rem]",
        className
      )}
      {...props}
    />
  )
}

function CourseOverviewFacts({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="course-overview-facts"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  )
}

function CourseOverviewFact({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="course-overview-fact"
      className={cn(
        "inline-flex items-center rounded-full border border-border/80 bg-card px-2.5 py-1 text-xs font-medium tracking-[0.01em] text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CourseOverviewSection({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="course-overview-section"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  )
}

function CourseOverviewSectionTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="course-overview-section-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function CourseOverviewList({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="course-overview-list"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function CourseOverviewItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="course-overview-item"
      className={cn(
        "text-sm leading-6 text-pretty text-muted-foreground before:mr-2 before:text-foreground/35 before:content-['·']",
        className
      )}
      {...props}
    />
  )
}

function CourseOverviewGenres({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="course-overview-genres"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  )
}

function CourseOverviewGenre({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="course-overview-genre"
      className={cn(
        "inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground/85",
        className
      )}
      {...props}
    />
  )
}

function CourseOverviewSamples({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="course-overview-samples"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function CourseOverviewSample({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="course-overview-sample"
      className={cn(
        "rounded-2xl border border-border/70 bg-card/60 px-3.5 py-3 text-sm leading-6 text-pretty",
        className
      )}
      {...props}
    />
  )
}

function CourseOverviewSampleLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="course-overview-sample-label"
      className={cn(
        "mb-1 text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  CourseOverview,
  CourseOverviewHeader,
  CourseOverviewEyebrow,
  CourseOverviewTitle,
  CourseOverviewLead,
  CourseOverviewFacts,
  CourseOverviewFact,
  CourseOverviewSection,
  CourseOverviewSectionTitle,
  CourseOverviewList,
  CourseOverviewItem,
  CourseOverviewGenres,
  CourseOverviewGenre,
  CourseOverviewSamples,
  CourseOverviewSample,
  CourseOverviewSampleLabel,
}
