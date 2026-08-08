import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";

type HintStepLevel = "observe" | "direction" | "example";

const HINT_STEP_LEVEL_LABELS: Record<HintStepLevel, string> = {
  observe: "관찰",
  direction: "방향",
  example: "예시",
};

function HintLadder({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="hint-ladder"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  );
}

function HintLadderHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="hint-ladder-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  );
}

function HintLadderTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="hint-ladder-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function HintLadderMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="hint-ladder-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  );
}

function HintLadderSteps({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol data-slot="hint-ladder-steps" className={cn("flex flex-col gap-2", className)} {...props} />
  );
}

const hintStepVariants = cva(
  "flex flex-col gap-2 rounded-2xl border px-3.5 py-3 transition-[opacity,background-color,border-color] duration-150",
  {
    variants: {
      level: {
        observe: "border-border/70 bg-card",
        direction: "border-border/70 bg-card",
        example: "border-border/70 bg-card",
      },
      revealed: {
        true: "",
        false: "opacity-60",
      },
    },
    defaultVariants: {
      level: "observe",
      revealed: false,
    },
  },
);

function HintStep({
  className,
  level = "observe",
  revealed = false,
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof hintStepVariants> & {
    level?: HintStepLevel;
    revealed?: boolean;
  }) {
  return (
    <li
      data-slot="hint-step"
      data-level={level}
      data-revealed={revealed || undefined}
      className={cn(hintStepVariants({ level, revealed }), className)}
      {...props}
    >
      {children}
    </li>
  );
}

function HintStepLabel({
  className,
  level = "observe",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  level?: HintStepLevel;
}) {
  return (
    <div
      data-slot="hint-step-label"
      data-level={level}
      className={cn(
        "text-xs font-medium tracking-[0.04em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    >
      {children ?? HINT_STEP_LEVEL_LABELS[level]}
    </div>
  );
}

function HintStepBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="hint-step-body"
      className={cn("text-sm leading-6 text-pretty text-foreground/90", className)}
      {...props}
    />
  );
}

function HintStepActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="hint-step-actions"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

export {
  HintLadder,
  HintLadderHeader,
  HintLadderTitle,
  HintLadderMeta,
  HintLadderSteps,
  HintStep,
  HintStepLabel,
  HintStepBody,
  HintStepActions,
  hintStepVariants,
  HINT_STEP_LEVEL_LABELS,
  type HintStepLevel,
};
