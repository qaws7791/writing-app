import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";

type StepTraceStatus = "completed" | "running" | "failed" | "pending" | "cancelled";
type StepTraceToolKind = "succeeded" | "failed" | "running" | "skipped";

const STEP_TRACE_STATUS_LABELS: Record<StepTraceStatus, string> = {
  completed: "완료",
  running: "실행 중",
  failed: "실패",
  pending: "대기",
  cancelled: "취소",
};

const STEP_TRACE_TOOL_STATUS_LABELS: Record<StepTraceToolKind, string> = {
  succeeded: "성공",
  failed: "실패",
  running: "실행 중",
  skipped: "건너뜀",
};

function StepTrace({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="step-trace"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  );
}

function StepTraceHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="step-trace-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  );
}

function StepTraceTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="step-trace-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function StepTraceMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="step-trace-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  );
}

function StepTraceList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="step-trace-list"
      className={cn("relative flex flex-col gap-2", className)}
      {...props}
    />
  );
}

const stepTraceStepVariants = cva(
  "grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 rounded-2xl border border-border/70 bg-card px-3.5 py-3",
  {
    variants: {
      status: {
        completed: "",
        running: "border-info/25 bg-info/[0.04]",
        failed: "border-destructive/25 bg-destructive/[0.04]",
        pending: "opacity-70",
        cancelled: "opacity-60",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  },
);

function StepTraceStep({
  className,
  status = "pending",
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof stepTraceStepVariants> & {
    status?: StepTraceStatus;
  }) {
  return (
    <li
      data-slot="step-trace-step"
      data-status={status}
      className={cn(stepTraceStepVariants({ status }), className)}
      {...props}
    />
  );
}

const stepTraceMarkVariants = cva(
  "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-medium tabular-nums",
  {
    variants: {
      status: {
        completed: "border-foreground/20 bg-foreground text-background",
        running: "border-info/40 bg-info/15 text-info",
        failed: "border-destructive/40 bg-destructive text-white",
        pending: "border-border bg-muted/40 text-muted-foreground",
        cancelled: "border-border/70 bg-muted/30 text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  },
);

function StepTraceMark({
  className,
  status = "pending",
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof stepTraceMarkVariants> & {
    status?: StepTraceStatus;
  }) {
  return (
    <span
      data-slot="step-trace-mark"
      data-status={status}
      className={cn(stepTraceMarkVariants({ status }), className)}
      {...props}
    >
      {children ??
        (status === "completed"
          ? "✓"
          : status === "failed"
            ? "×"
            : status === "running"
              ? "…"
              : "")}
    </span>
  );
}

function StepTraceBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="step-trace-body"
      className={cn("min-w-0 flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function StepTraceStepHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="step-trace-step-header"
      className={cn("flex items-start justify-between gap-3", className)}
      {...props}
    />
  );
}

function StepTraceStepTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="step-trace-step-title"
      className={cn("text-sm font-medium tracking-[-0.01em] text-pretty", className)}
      {...props}
    />
  );
}

function StepTraceDuration({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="step-trace-duration"
      className={cn("shrink-0 text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  );
}

function StepTraceDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="step-trace-description"
      className={cn("text-xs leading-5 text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}

const stepTraceStatusVariants = cva(
  "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-[-0.01em]",
  {
    variants: {
      status: {
        completed: "border-success/30 bg-success/8 text-success",
        running: "border-info/30 bg-info/8 text-info",
        failed: "border-destructive/30 bg-destructive/8 text-destructive",
        pending: "border-border/80 bg-muted/30 text-muted-foreground",
        cancelled: "border-border/70 bg-muted/20 text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  },
);

function StepTraceStatusBadge({
  className,
  status = "pending",
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof stepTraceStatusVariants> & {
    status?: StepTraceStatus;
  }) {
  return (
    <span
      data-slot="step-trace-status"
      data-status={status}
      className={cn(stepTraceStatusVariants({ status }), className)}
      {...props}
    >
      {children ?? STEP_TRACE_STATUS_LABELS[status]}
    </span>
  );
}

function StepTraceTools({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="step-trace-tools"
      className={cn("flex flex-col gap-1 border-t border-border/50 pt-2", className)}
      {...props}
    />
  );
}

function StepTraceTool({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="step-trace-tool"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/30 px-2.5 py-2 text-xs",
        className,
      )}
      {...props}
    />
  );
}

function StepTraceToolName({ className, ...props }: React.ComponentProps<"code">) {
  return (
    <code
      data-slot="step-trace-tool-name"
      className={cn("font-mono text-[11px] tracking-[-0.01em] text-foreground/85", className)}
      {...props}
    />
  );
}

const stepTraceToolStatusVariants = cva(
  "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
  {
    variants: {
      status: {
        succeeded: "border-success/25 bg-transparent text-success",
        failed: "border-destructive/25 bg-transparent text-destructive",
        running: "border-info/25 bg-transparent text-info",
        skipped: "border-border/70 bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "succeeded",
    },
  },
);

function StepTraceToolStatus({
  className,
  status = "succeeded",
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof stepTraceToolStatusVariants> & {
    status?: StepTraceToolKind;
  }) {
  return (
    <span
      data-slot="step-trace-tool-status"
      data-status={status}
      className={cn(stepTraceToolStatusVariants({ status }), className)}
      {...props}
    >
      {children ?? STEP_TRACE_TOOL_STATUS_LABELS[status]}
    </span>
  );
}

function StepTraceToolDuration({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="step-trace-tool-duration"
      className={cn("tabular-nums text-muted-foreground", className)}
      {...props}
    />
  );
}

function StepTraceError({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="step-trace-error"
      role="alert"
      className={cn(
        "rounded-xl border border-destructive/25 bg-destructive/[0.06] px-3 py-2.5 text-xs leading-5 text-pretty text-destructive",
        className,
      )}
      {...props}
    />
  );
}

function StepTraceEmpty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="step-trace-empty"
      className={cn(
        "rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  StepTrace,
  StepTraceHeader,
  StepTraceTitle,
  StepTraceMeta,
  StepTraceList,
  StepTraceStep,
  StepTraceMark,
  StepTraceBody,
  StepTraceStepHeader,
  StepTraceStepTitle,
  StepTraceDuration,
  StepTraceDescription,
  StepTraceStatusBadge,
  StepTraceTools,
  StepTraceTool,
  StepTraceToolName,
  StepTraceToolStatus,
  StepTraceToolDuration,
  StepTraceError,
  StepTraceEmpty,
  stepTraceStepVariants,
  stepTraceMarkVariants,
  stepTraceStatusVariants,
  STEP_TRACE_STATUS_LABELS,
  STEP_TRACE_TOOL_STATUS_LABELS,
  type StepTraceStatus,
  type StepTraceToolKind,
};
