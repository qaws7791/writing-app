import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";

type RevisionState = "draft" | "revision" | "final";

const REVISION_STATE_LABELS: Record<RevisionState, string> = {
  draft: "초안",
  revision: "수정",
  final: "최종",
};

function RevisionHistory({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="revision-history"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  );
}

function RevisionHistoryHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="revision-history-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  );
}

function RevisionHistoryTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="revision-history-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function RevisionHistoryList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="revision-history-list"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  );
}

const revisionEntryVariants = cva(
  "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-2.5 py-2.5",
  {
    variants: {
      state: {
        draft: "hover:bg-muted/40",
        revision: "bg-foreground/[0.03] ring-1 ring-foreground/10 dark:bg-foreground/[0.05]",
        final: "bg-foreground/[0.04] ring-1 ring-foreground/10 dark:bg-foreground/[0.06]",
      },
    },
    defaultVariants: {
      state: "draft",
    },
  },
);

function RevisionEntry({
  className,
  state = "draft",
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof revisionEntryVariants> & {
    state?: RevisionState;
  }) {
  return (
    <li
      data-slot="revision-entry"
      data-state={state}
      className={cn(revisionEntryVariants({ state }), className)}
      {...props}
    />
  );
}

function RevisionEntryMark({
  className,
  state = "draft",
  children,
  ...props
}: React.ComponentProps<"span"> & {
  state?: RevisionState;
}) {
  return (
    <span
      data-slot="revision-entry-mark"
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border/80 bg-card text-[10px] font-medium tabular-nums text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children ?? REVISION_STATE_LABELS[state].slice(0, 1)}
    </span>
  );
}

function RevisionEntryTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="revision-entry-title"
      className={cn("min-w-0 truncate text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function RevisionEntryMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="revision-entry-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  );
}

function RevisionEntryActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="revision-entry-actions"
      className={cn("flex shrink-0 items-center gap-1.5", className)}
      {...props}
    />
  );
}

function RevisionHistoryCompare({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="revision-history-compare" className={cn("mt-2", className)} {...props} />;
}

export {
  RevisionHistory,
  RevisionHistoryHeader,
  RevisionHistoryTitle,
  RevisionHistoryList,
  RevisionEntry,
  RevisionEntryMark,
  RevisionEntryTitle,
  RevisionEntryMeta,
  RevisionEntryActions,
  RevisionHistoryCompare,
  revisionEntryVariants,
  REVISION_STATE_LABELS,
  type RevisionState,
};
