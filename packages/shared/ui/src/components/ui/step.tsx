import * as React from "react"

import { cn } from "#ui/lib/utils"

function Step({ className, ...props }: React.ComponentProps<"article">) {
  return (
    <article
      data-slot="step"
      className={cn("mx-auto flex w-full max-w-2xl flex-col gap-8", className)}
      {...props}
    />
  )
}

function StepHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="step-header"
      className={cn("flex flex-col gap-3 text-left", className)}
      {...props}
    />
  )
}

function StepEyebrow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="step-eyebrow"
      className={cn("text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  )
}

function StepTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="step-title"
      className={cn(
        "font-heading text-2xl font-semibold text-balance sm:text-[1.75rem]",
        className
      )}
      {...props}
    />
  )
}

function StepPrompt({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="step-prompt"
      className={cn(
        "text-base leading-7 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function StepGuide({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="step-guide"
      className={cn(
        "text-sm leading-6 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function StepMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="step-media"
      className={cn(
        "overflow-hidden rounded-4xl border border-border/70 bg-surface/60 [&_img]:aspect-video [&_img]:w-full [&_img]:object-cover",
        className
      )}
      {...props}
    />
  )
}

function StepBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="step-body"
      className={cn("flex flex-col gap-6", className)}
      {...props}
    />
  )
}

function StepFooter({ className, ...props }: React.ComponentProps<"footer">) {
  return (
    <footer
      data-slot="step-footer"
      className={cn("flex flex-col gap-4 pt-2", className)}
      {...props}
    />
  )
}

function StepActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="step-actions"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

export {
  Step,
  StepActions,
  StepBody,
  StepEyebrow,
  StepFooter,
  StepGuide,
  StepHeader,
  StepMedia,
  StepPrompt,
  StepTitle,
}
