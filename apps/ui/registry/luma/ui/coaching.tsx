"use client";

import * as React from "react";

import { cn } from "@/registry/luma/lib/utils";
import { Spinner } from "@/registry/luma/ui/spinner";

type CoachingPhase = "idle" | "loading" | "ready" | "error" | "limited";

function Coaching({
  className,
  status = "idle",
  ...props
}: React.ComponentProps<"div"> & {
  status?: CoachingPhase;
}) {
  return (
    <div
      data-slot="coaching"
      data-status={status}
      className={cn("flex w-full flex-col gap-5", className)}
      {...props}
    />
  );
}

function CoachingFocus({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="coaching-focus"
      className={cn(
        "inline-flex w-fit items-center rounded-full border border-border/80 bg-card px-2.5 py-1 text-xs font-medium tracking-[0.02em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CoachingSource({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="coaching-source"
      className={cn("rounded-3xl border border-border/70 bg-surface/70 px-5 py-4", className)}
      {...props}
    />
  );
}

function CoachingSourceLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="coaching-source-label"
      className={cn(
        "mb-2 text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}

function CoachingSourceBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="coaching-source-body"
      className={cn(
        "text-sm leading-6 text-pretty text-foreground/90 whitespace-pre-wrap",
        className,
      )}
      {...props}
    />
  );
}

function CoachingStatus({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="coaching-status"
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2.5 rounded-3xl border border-border/70 bg-card px-4 py-3.5 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    >
      <Spinner className="size-4" />
      <span>{children ?? "피드백을 준비하고 있습니다…"}</span>
    </div>
  );
}

function CoachingResult({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="coaching-result" className={cn("flex flex-col gap-4", className)} {...props} />
  );
}

function CoachingSummary({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="coaching-summary"
      className={cn(
        "rounded-3xl border border-border/80 bg-card px-5 py-4 text-sm leading-6 text-pretty shadow-2xs",
        className,
      )}
      {...props}
    />
  );
}

function CoachingSection({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="coaching-section"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function CoachingSectionTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="coaching-section-title"
      className={cn(
        "text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}

function CoachingList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="coaching-list"
      className={cn("flex list-disc flex-col gap-1.5 pl-4 text-sm leading-6", className)}
      {...props}
    />
  );
}

function CoachingItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="coaching-item" className={cn("text-pretty", className)} {...props} />;
}

function CoachingActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="coaching-actions"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    />
  );
}

function CoachingMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="coaching-meta"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Coaching,
  CoachingFocus,
  CoachingSource,
  CoachingSourceLabel,
  CoachingSourceBody,
  CoachingStatus,
  CoachingResult,
  CoachingSummary,
  CoachingSection,
  CoachingSectionTitle,
  CoachingList,
  CoachingItem,
  CoachingActions,
  CoachingMeta,
};
export type { CoachingPhase };
