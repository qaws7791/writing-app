import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";

type PracticeQueuePriority = "low" | "normal" | "high";

const PRACTICE_QUEUE_PRIORITY_LABELS: Record<PracticeQueuePriority, string> = {
  low: "낮음",
  normal: "보통",
  high: "높음",
};

function PracticeQueue({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="practice-queue"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  );
}

function PracticeQueueHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="practice-queue-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  );
}

function PracticeQueueTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="practice-queue-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function PracticeQueueMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="practice-queue-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  );
}

function PracticeQueueList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="practice-queue-list"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  );
}

const practiceQueueItemVariants = cva(
  "flex flex-col gap-1 rounded-2xl border border-border/70 bg-card px-3.5 py-3",
  {
    variants: {
      priority: {
        low: "",
        normal: "",
        high: "border-foreground/15 bg-foreground/[0.03] dark:bg-foreground/[0.05]",
      },
    },
    defaultVariants: {
      priority: "normal",
    },
  },
);

function PracticeQueueItem({
  className,
  priority = "normal",
  reason,
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof practiceQueueItemVariants> & {
    priority?: PracticeQueuePriority;
    reason?: React.ReactNode;
  }) {
  return (
    <li
      data-slot="practice-queue-item"
      data-priority={priority}
      data-reason={reason != null ? "" : undefined}
      className={cn(practiceQueueItemVariants({ priority }), className)}
      {...props}
    >
      {children}
    </li>
  );
}

function PracticeQueueItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="practice-queue-item-title"
      className={cn("text-sm font-medium tracking-[-0.01em] text-pretty", className)}
      {...props}
    />
  );
}

function PracticeQueueItemReason({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="practice-queue-item-reason"
      className={cn("text-xs leading-5 text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}

function PracticeQueueItemMeta({
  className,
  priority,
  children,
  ...props
}: React.ComponentProps<"p"> & {
  priority?: PracticeQueuePriority;
}) {
  return (
    <p
      data-slot="practice-queue-item-meta"
      data-priority={priority}
      className={cn("text-[11px] tabular-nums text-muted-foreground", className)}
      {...props}
    >
      {children ?? (priority ? PRACTICE_QUEUE_PRIORITY_LABELS[priority] : undefined)}
    </p>
  );
}

function PracticeQueueHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="practice-queue-hint"
      className={cn("text-xs leading-5 text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}

function PracticeQueueActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="practice-queue-actions"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    />
  );
}

export {
  PracticeQueue,
  PracticeQueueHeader,
  PracticeQueueTitle,
  PracticeQueueMeta,
  PracticeQueueList,
  PracticeQueueItem,
  PracticeQueueItemTitle,
  PracticeQueueItemReason,
  PracticeQueueItemMeta,
  PracticeQueueHint,
  PracticeQueueActions,
  practiceQueueItemVariants,
  PRACTICE_QUEUE_PRIORITY_LABELS,
  type PracticeQueuePriority,
};
