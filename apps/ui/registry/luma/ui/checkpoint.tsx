import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";

type CheckpointStatus = "ready" | "in-progress" | "passed" | "needs-review";

const CHECKPOINT_STATUS_LABELS: Record<CheckpointStatus, string> = {
  ready: "준비됨",
  "in-progress": "진행 중",
  passed: "통과",
  "needs-review": "재검토 필요",
};

const checkpointVariants = cva("flex w-full flex-col gap-3", {
  variants: {
    status: {
      ready: "",
      "in-progress": "",
      passed: "",
      "needs-review": "",
    },
  },
  defaultVariants: {
    status: "ready",
  },
});

function Checkpoint({
  className,
  status = "ready",
  ...props
}: React.ComponentProps<"section"> &
  VariantProps<typeof checkpointVariants> & {
    status?: CheckpointStatus;
  }) {
  return (
    <section
      data-slot="checkpoint"
      data-status={status}
      className={cn(checkpointVariants({ status }), className)}
      {...props}
    />
  );
}

function CheckpointHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="checkpoint-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  );
}

function CheckpointTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="checkpoint-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function CheckpointMeta({
  className,
  status,
  children,
  ...props
}: React.ComponentProps<"p"> & {
  status?: CheckpointStatus;
}) {
  return (
    <p
      data-slot="checkpoint-meta"
      data-status={status}
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    >
      {children ?? (status ? CHECKPOINT_STATUS_LABELS[status] : undefined)}
    </p>
  );
}

function CheckpointDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="checkpoint-description"
      className={cn("text-sm leading-6 text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}

function CheckpointObjectives({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="checkpoint-objectives"
      className={cn("flex w-full flex-col gap-0", className)}
      {...props}
    />
  );
}

const checkpointObjectiveVariants = cva(
  "grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0",
  {
    variants: {
      met: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      met: false,
    },
  },
);

const checkpointObjectiveMarkVariants = cva(
  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium",
  {
    variants: {
      met: {
        true: "border-foreground/20 bg-foreground text-background",
        false: "border-border/70 bg-muted/40 text-muted-foreground",
      },
    },
    defaultVariants: {
      met: false,
    },
  },
);

function CheckpointObjective({
  className,
  met = false,
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof checkpointObjectiveVariants> & {
    met?: boolean;
  }) {
  return (
    <li
      data-slot="checkpoint-objective"
      data-met={met || undefined}
      className={cn(checkpointObjectiveVariants({ met }), className)}
      {...props}
    >
      <span
        data-slot="checkpoint-objective-mark"
        aria-hidden
        className={cn(checkpointObjectiveMarkVariants({ met }))}
      >
        {met ? "✓" : ""}
      </span>
      <div
        data-slot="checkpoint-objective-body"
        className={cn(
          "min-w-0 text-sm leading-6 text-pretty tracking-[-0.01em]",
          met ? "text-muted-foreground line-through decoration-border/80" : "",
        )}
      >
        {children}
      </div>
    </li>
  );
}

function CheckpointScore({
  className,
  value,
  label,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  value?: React.ReactNode;
  label?: React.ReactNode;
}) {
  return (
    <div
      data-slot="checkpoint-score"
      className={cn(
        "flex items-baseline justify-between gap-3 rounded-2xl border border-border/70 bg-card px-3.5 py-2.5",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          {label ? (
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
          ) : null}
          {value != null ? (
            <span className="text-sm font-medium tabular-nums tracking-[-0.01em]">{value}</span>
          ) : null}
        </>
      )}
    </div>
  );
}

function CheckpointHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="checkpoint-hint"
      className={cn("text-xs leading-5 text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}

function CheckpointActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="checkpoint-actions"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    />
  );
}

export {
  Checkpoint,
  CheckpointHeader,
  CheckpointTitle,
  CheckpointMeta,
  CheckpointDescription,
  CheckpointObjectives,
  CheckpointObjective,
  CheckpointScore,
  CheckpointHint,
  CheckpointActions,
  checkpointVariants,
  checkpointObjectiveVariants,
  checkpointObjectiveMarkVariants,
  CHECKPOINT_STATUS_LABELS,
  type CheckpointStatus,
};
