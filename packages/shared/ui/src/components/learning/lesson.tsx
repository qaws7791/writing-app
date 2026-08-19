"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { ResetIcon } from "#ui/components/icons"
import { XIcon } from "#ui/components/icons/control-icons"
import { Button } from "#ui/components/primitives/button"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "#ui/components/primitives/progress"
import { cn } from "#ui/lib/utils"

const lessonFeedbackVariants = cva(
  "w-full min-w-0 border-t pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] group/lesson-feedback",
  {
    variants: {
      tone: {
        correct: "border-success/20 bg-success/12 text-success",
        incorrect: "border-warning/20 bg-warning/12 text-warning",
      },
    },
    defaultVariants: {
      tone: "correct",
    },
  }
)

function Lesson({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson"
      className={cn(
        "flex min-h-0 w-full min-w-0 flex-col bg-background",
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
      className={cn(
        "mx-auto flex min-h-9 w-full min-w-0 max-w-2xl shrink-0 items-center gap-3 px-4 pb-4 sm:px-6",
        className
      )}
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
      size="icon"
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
      className={cn(
        "mx-auto flex min-h-0 w-full min-w-0 max-w-2xl flex-1 flex-col gap-8 px-4 py-2 sm:px-6",
        className
      )}
      {...props}
    />
  )
}

function LessonFooter({ className, ...props }: React.ComponentProps<"footer">) {
  return (
    <footer
      data-slot="lesson-footer"
      className={cn(
        "sticky bottom-0 mt-auto w-full min-w-0 shrink-0 bg-background/90 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md",
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
        "mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-2 px-4 sm:px-6 *:w-full [&_[data-slot=button]]:h-12 [&_[data-slot=button]]:w-full",
        className
      )}
      {...props}
    />
  )
}

function LessonFeedback({
  className,
  tone = "correct",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof lessonFeedbackVariants>) {
  return (
    <div
      data-slot="lesson-feedback"
      data-tone={tone}
      role="status"
      className={cn(lessonFeedbackVariants({ tone }), className)}
      {...props}
    />
  )
}

function LessonFeedbackBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-feedback-body"
      className={cn(
        "mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-3 px-4 sm:px-6",
        className
      )}
      {...props}
    />
  )
}

function LessonFeedbackTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-feedback-title"
      className={cn(
        "text-lg font-semibold tracking-[-0.01em] text-balance",
        className
      )}
      {...props}
    />
  )
}

function LessonFeedbackDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="lesson-feedback-description"
      className={cn(
        "min-w-0 text-sm leading-6 text-pretty group-data-[tone=correct]/lesson-feedback:text-success/85 group-data-[tone=incorrect]/lesson-feedback:text-warning/85",
        className
      )}
      {...props}
    />
  )
}

function LessonFeedbackActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-feedback-actions"
      className={cn(
        "flex w-full min-w-0 items-stretch gap-2 [&_[data-slot=button]]:h-12",
        className
      )}
      {...props}
    />
  )
}

function LessonFeedbackRetryButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      aria-label="다시 시도"
      className={cn(
        "shrink-0 border-warning/30 bg-warning/10 text-warning hover:bg-warning/16 dark:bg-warning/18 dark:hover:bg-warning/26",
        className
      )}
      size="icon-lg"
      type="button"
      variant="outline"
      {...props}
    >
      <ResetIcon aria-hidden="true" />
    </Button>
  )
}

function LessonFeedbackContinueButton({
  className,
  tone = "correct",
  ...props
}: React.ComponentProps<typeof Button> & {
  readonly tone?: "correct" | "incorrect"
}) {
  return (
    <Button
      className={cn(
        tone === "incorrect" ? "min-w-0 flex-1" : "w-full",
        className
      )}
      size="lg"
      type="button"
      variant={tone === "correct" ? "success" : "warning"}
      {...props}
    />
  )
}

function LessonComplete({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-complete"
      className={cn(
        "mx-auto flex w-full min-w-0 flex-col items-center gap-5 py-16 text-center",
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
  LessonFeedback,
  LessonFeedbackActions,
  LessonFeedbackBody,
  LessonFeedbackContinueButton,
  LessonFeedbackDescription,
  LessonFeedbackRetryButton,
  LessonFeedbackTitle,
  LessonFooter,
  LessonHeader,
  LessonMeta,
  LessonProgress,
  lessonFeedbackVariants,
}
