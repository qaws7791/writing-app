import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type ContentReviewStatusValue = "pending" | "approved" | "changes-requested"

const CONTENT_REVIEW_STATUS_LABELS: Record<ContentReviewStatusValue, string> = {
  pending: "검토 대기",
  "changes-requested": "수정 요청",
  approved: "승인됨",
}

function ContentReview({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="content-review"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  )
}

function ContentReviewHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="content-review-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function ContentReviewTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="content-review-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function ContentReviewMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="content-review-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function ContentReviewDiff({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="content-review-diff"
      className={cn(
        "rounded-3xl border border-border/70 bg-surface/70 px-4 py-3.5 font-mono text-sm leading-6",
        className
      )}
      {...props}
    />
  )
}

function ContentReviewComments({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="content-review-comments"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

const contentReviewCommentVariants = cva(
  "flex flex-col gap-1.5 rounded-2xl border border-border/70 bg-card px-3.5 py-3",
  {
    variants: {
      resolved: {
        true: "opacity-60",
        false: "",
      },
    },
    defaultVariants: {
      resolved: false,
    },
  }
)

function ContentReviewComment({
  className,
  resolved = false,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof contentReviewCommentVariants>) {
  return (
    <li
      data-slot="content-review-comment"
      data-resolved={resolved || undefined}
      className={cn(contentReviewCommentVariants({ resolved }), className)}
      {...props}
    />
  )
}

function ContentReviewCommentAuthor({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="content-review-comment-author"
      className={cn("text-xs font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function ContentReviewCommentBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="content-review-comment-body"
      className={cn(
        "text-sm leading-6 text-pretty text-foreground/90",
        className
      )}
      {...props}
    />
  )
}

function ContentReviewCommentMeta({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="content-review-comment-meta"
      className={cn(
        "text-[11px] tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function ContentReviewAssignee({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="content-review-assignee"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

const contentReviewStatusVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-[0.02em]",
  {
    variants: {
      status: {
        pending: "border-border/80 bg-card text-muted-foreground",
        "changes-requested":
          "border-foreground/15 bg-foreground/[0.04] text-foreground/80",
        approved: "border-border/80 bg-card text-foreground/70",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  }
)

function ContentReviewStatus({
  className,
  status = "pending",
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof contentReviewStatusVariants> & {
    status?: ContentReviewStatusValue
  }) {
  return (
    <span
      data-slot="content-review-status"
      data-status={status}
      className={cn(contentReviewStatusVariants({ status }), className)}
      {...props}
    >
      {children ?? CONTENT_REVIEW_STATUS_LABELS[status]}
    </span>
  )
}

function ContentReviewActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="content-review-actions"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    />
  )
}

export {
  ContentReview,
  ContentReviewHeader,
  ContentReviewTitle,
  ContentReviewMeta,
  ContentReviewDiff,
  ContentReviewComments,
  ContentReviewComment,
  ContentReviewCommentAuthor,
  ContentReviewCommentBody,
  ContentReviewCommentMeta,
  ContentReviewAssignee,
  ContentReviewStatus,
  ContentReviewActions,
  contentReviewCommentVariants,
  contentReviewStatusVariants,
  CONTENT_REVIEW_STATUS_LABELS,
  type ContentReviewStatusValue,
}
