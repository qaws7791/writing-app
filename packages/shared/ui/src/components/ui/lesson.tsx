"use client"

import * as React from "react"

import { XIcon } from "#ui/components/icons/control-icons"
import { Button } from "#ui/components/ui/button"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "#ui/components/ui/progress"
import { cn } from "#ui/lib/utils"

function Lesson({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson"
      className={cn(
        "mx-auto flex min-h-0 w-full max-w-2xl flex-col bg-background",
        className
      )}
      {...props}
    />
  )
}

function LessonHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="lesson-header"
      className={cn("flex min-h-9 items-center gap-3 pb-4", className)}
      {...props}
    />
  )
}

function LessonClose({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      aria-label="레슨 나가기"
      className={cn("-ml-2.5", className)}
      data-slot="lesson-close"
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      <XIcon aria-hidden="true" />
    </Button>
  )
}

function LessonProgress({
  className,
  value,
  label = "진행",
  ...props
}: React.ComponentProps<typeof Progress> & {
  label?: string
}) {
  return (
    <Progress
      className={cn(
        "h-9 min-w-0 flex-1 flex-nowrap items-center gap-0",
        className
      )}
      data-slot="lesson-progress"
      value={value}
      {...props}
    >
      <ProgressLabel className="sr-only">{label}</ProgressLabel>
      <ProgressValue className="sr-only" />
    </Progress>
  )
}

function LessonMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-meta"
      className={cn(
        "flex h-9 shrink-0 items-center text-xs tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function LessonBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-body"
      className={cn("flex min-h-0 flex-1 flex-col gap-8 py-2", className)}
      {...props}
    />
  )
}

function LessonFooter({ className, ...props }: React.ComponentProps<"footer">) {
  return (
    <footer
      data-slot="lesson-footer"
      className={cn(
        "sticky bottom-0 mt-auto bg-background/90 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md",
        className
      )}
      {...props}
    />
  )
}

function LessonActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-actions"
      className={cn(
        "flex w-full flex-col gap-2 *:w-full [&_[data-slot=button]]:h-12 [&_[data-slot=button]]:w-full",
        className
      )}
      {...props}
    />
  )
}

function LessonComplete({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-complete"
      className={cn(
        "mx-auto flex w-full flex-col items-center gap-5 py-16 text-center",
        className
      )}
      {...props}
    />
  )
}

function LessonCompleteTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-complete-title"
      className={cn(
        "font-heading text-3xl font-semibold text-balance",
        className
      )}
      {...props}
    />
  )
}

function LessonCompleteDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="lesson-complete-description"
      className={cn(
        "max-w-prose text-base leading-7 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Lesson,
  LessonActions,
  LessonBody,
  LessonClose,
  LessonComplete,
  LessonCompleteDescription,
  LessonCompleteTitle,
  LessonFooter,
  LessonHeader,
  LessonMeta,
  LessonProgress,
}
