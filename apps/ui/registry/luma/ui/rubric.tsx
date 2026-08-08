import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";

function Rubric({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="rubric"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  );
}

function RubricHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="rubric-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  );
}

function RubricTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rubric-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function RubricMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="rubric-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  );
}

function RubricList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="rubric-list" className={cn("flex flex-col gap-3", className)} {...props} />
  );
}

function RubricCriterion({
  className,
  weight,
  ...props
}: React.ComponentProps<"div"> & {
  weight?: number;
}) {
  return (
    <div
      data-slot="rubric-criterion"
      data-weight={weight}
      className={cn(
        "flex flex-col gap-3 rounded-3xl border border-border/70 bg-card px-4 py-4 shadow-2xs",
        className,
      )}
      {...props}
    />
  );
}

function RubricCriterionLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rubric-criterion-label"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function RubricCriterionWeight({
  className,
  weight,
  children,
  ...props
}: React.ComponentProps<"span"> & {
  weight?: number;
}) {
  return (
    <span
      data-slot="rubric-criterion-weight"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    >
      {children ?? (weight !== undefined ? `${weight}%` : null)}
    </span>
  );
}

function RubricCriterionDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="rubric-criterion-description"
      className={cn("text-xs leading-5 text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}

function RubricLevels({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="rubric-levels" className={cn("flex flex-wrap gap-2", className)} {...props} />
  );
}

const rubricLevelVariants = cva(
  "inline-flex items-center rounded-2xl border px-3 py-1.5 text-xs font-medium tracking-[0.01em] transition-colors duration-150",
  {
    variants: {
      active: {
        true: "border-foreground/15 bg-foreground/[0.04] text-foreground",
        false: "border-border/70 bg-transparent text-muted-foreground hover:bg-muted/40",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

function RubricLevel({
  className,
  active = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof rubricLevelVariants> & {
    active?: boolean;
  }) {
  return (
    <button
      type="button"
      data-slot="rubric-level"
      data-active={active || undefined}
      aria-pressed={active}
      className={cn(rubricLevelVariants({ active }), className)}
      {...props}
    />
  );
}

function RubricJudgment({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rubric-judgment"
      className={cn("rounded-2xl border border-border/70 bg-surface/60 px-3.5 py-3", className)}
      {...props}
    />
  );
}

function RubricJudgmentLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rubric-judgment-label"
      className={cn("text-xs font-medium tracking-[0.02em] text-muted-foreground", className)}
      {...props}
    />
  );
}

function RubricJudgmentReason({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="rubric-judgment-reason"
      className={cn("mt-1 text-sm leading-6 text-pretty text-foreground/90", className)}
      {...props}
    />
  );
}

export {
  Rubric,
  RubricHeader,
  RubricTitle,
  RubricMeta,
  RubricList,
  RubricCriterion,
  RubricCriterionLabel,
  RubricCriterionWeight,
  RubricCriterionDescription,
  RubricLevels,
  RubricLevel,
  RubricJudgment,
  RubricJudgmentLabel,
  RubricJudgmentReason,
  rubricLevelVariants,
};
