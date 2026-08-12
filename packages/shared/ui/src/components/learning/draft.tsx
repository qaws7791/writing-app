"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"
import { Textarea } from "#ui/components/primitives/textarea"

type DraftStatusValue =
  | "editing"
  | "saving"
  | "saved"
  | "offline"
  | "submittable"
  | "submitted"

const DRAFT_STATUS_LABELS: Record<DraftStatusValue, string> = {
  editing: "작성 중",
  saving: "저장 중…",
  saved: "저장됨",
  offline: "오프라인",
  submittable: "제출 가능",
  submitted: "제출됨",
}

function Draft({
  className,
  status = "editing",
  ...props
}: React.ComponentProps<"section"> & {
  status?: DraftStatusValue
}) {
  return (
    <section
      data-slot="draft"
      data-status={status}
      className={cn("flex w-full flex-col gap-5", className)}
      {...props}
    />
  )
}

function DraftHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="draft-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function DraftTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="draft-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

const draftStatusVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-[0.02em]",
  {
    variants: {
      status: {
        editing: "border-border/80 bg-card text-muted-foreground",
        saving: "border-border/80 bg-card text-muted-foreground",
        saved: "border-border/80 bg-card text-foreground/70",
        offline: "border-border/80 bg-muted/50 text-muted-foreground",
        submittable:
          "border-foreground/15 bg-foreground/[0.04] text-foreground/80",
        submitted: "border-border/80 bg-card text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "editing",
    },
  }
)

function DraftStatus({
  className,
  status = "editing",
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof draftStatusVariants> & {
    status?: DraftStatusValue
  }) {
  return (
    <span
      data-slot="draft-status"
      data-status={status}
      role="status"
      aria-live="polite"
      className={cn(draftStatusVariants({ status }), className)}
      {...props}
    >
      {children ?? DRAFT_STATUS_LABELS[status]}
    </span>
  )
}

function DraftEditor({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      data-slot="draft-editor"
      className={cn(
        "min-h-56 rounded-3xl text-base leading-7 md:min-h-72 md:text-base",
        className
      )}
      {...props}
    />
  )
}

function DraftMeter({
  className,
  characters = 0,
  paragraphs = 0,
  minCharacters,
  ...props
}: React.ComponentProps<"div"> & {
  characters?: number
  paragraphs?: number
  minCharacters?: number
}) {
  const meetsMin = minCharacters === undefined || characters >= minCharacters

  return (
    <div
      data-slot="draft-meter"
      data-state={meetsMin ? "ready" : "short"}
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "font-medium",
          meetsMin ? "text-foreground/80" : "text-muted-foreground"
        )}
      >
        {characters.toLocaleString("ko-KR")}자
      </span>
      <span>{paragraphs.toLocaleString("ko-KR")}문단</span>
      {minCharacters !== undefined && (
        <span>최소 {minCharacters.toLocaleString("ko-KR")}자</span>
      )}
    </div>
  )
}

function DraftVersions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="draft-versions"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

function DraftActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="draft-actions"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    />
  )
}

export {
  Draft,
  DraftHeader,
  DraftTitle,
  DraftStatus,
  DraftEditor,
  DraftMeter,
  DraftVersions,
  DraftActions,
  draftStatusVariants,
  DRAFT_STATUS_LABELS,
  type DraftStatusValue,
}
