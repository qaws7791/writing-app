import * as React from "react";

import { cn } from "@/registry/luma/lib/utils";

function LearnerRecord({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="learner-record"
      className={cn("flex w-full flex-col gap-5", className)}
      {...props}
    />
  );
}

function LearnerRecordHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="learner-record-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  );
}

function LearnerRecordTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learner-record-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function LearnerRecordMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="learner-record-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  );
}

function LearnerRecordSection({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="learner-record-section"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function LearnerRecordSectionTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learner-record-section-title"
      className={cn(
        "text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}

function LearnerRecordPath({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learner-record-path"
      className={cn(
        "rounded-2xl border border-border/70 bg-card px-3.5 py-3 text-sm leading-6",
        className,
      )}
      {...props}
    />
  );
}

function LearnerRecordMastery({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learner-record-mastery"
      className={cn(
        "rounded-2xl border border-border/70 bg-card px-3.5 py-3 text-sm leading-6",
        className,
      )}
      {...props}
    />
  );
}

function LearnerRecordAttempts({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learner-record-attempts"
      className={cn(
        "rounded-2xl border border-border/70 bg-card px-3.5 py-3 text-sm leading-6",
        className,
      )}
      {...props}
    />
  );
}

function LearnerRecordSubmissions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learner-record-submissions"
      className={cn(
        "rounded-2xl border border-border/70 bg-card px-3.5 py-3 text-sm leading-6",
        className,
      )}
      {...props}
    />
  );
}

function LearnerRecordSupport({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learner-record-support"
      className={cn(
        "rounded-2xl border border-border/70 bg-card px-3.5 py-3 text-sm leading-6",
        className,
      )}
      {...props}
    />
  );
}

export {
  LearnerRecord,
  LearnerRecordHeader,
  LearnerRecordTitle,
  LearnerRecordMeta,
  LearnerRecordSection,
  LearnerRecordSectionTitle,
  LearnerRecordPath,
  LearnerRecordMastery,
  LearnerRecordAttempts,
  LearnerRecordSubmissions,
  LearnerRecordSupport,
};
