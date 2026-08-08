"use client";

import * as React from "react";

import { cn } from "@/registry/luma/lib/utils";
import { Progress, ProgressLabel, ProgressValue } from "@/registry/luma/ui/progress";

function Goal({
  className,
  value = 0,
  target = 1,
  unit = "레슨",
  children,
  ...props
}: React.ComponentProps<"section"> & {
  value?: number;
  target?: number;
  unit?: string;
}) {
  const safeTarget = Math.max(target, 1);
  const clamped = Math.min(Math.max(value, 0), safeTarget);
  const percent = Math.round((clamped / safeTarget) * 100);
  const remaining = Math.max(safeTarget - clamped, 0);
  const complete = remaining === 0;

  return (
    <section
      data-slot="goal"
      data-state={complete ? "complete" : "active"}
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    >
      {children ?? (
        <>
          <GoalHeader>
            <GoalTitle>오늘 목표</GoalTitle>
            <GoalValue>
              {clamped} / {safeTarget} {unit}
            </GoalValue>
          </GoalHeader>
          <GoalTrack value={percent} label="목표 진행" />
          <GoalHint>
            {complete
              ? "오늘 목표를 채웠습니다."
              : unit === "분"
                ? `${remaining}분 남았습니다.`
                : `${remaining} ${unit} 남았습니다.`}
          </GoalHint>
        </>
      )}
    </section>
  );
}

function GoalHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="goal-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  );
}

function GoalTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="goal-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function GoalValue({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="goal-value"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  );
}

function GoalTrack({
  className,
  value,
  label = "목표 진행",
  ...props
}: React.ComponentProps<typeof Progress> & {
  label?: string;
}) {
  return (
    <Progress value={value} data-slot="goal-track" className={cn("gap-1.5", className)} {...props}>
      <ProgressLabel className="sr-only">{label}</ProgressLabel>
      <ProgressValue className="sr-only" />
    </Progress>
  );
}

function GoalHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="goal-hint"
      className={cn("text-xs leading-5 text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Goal, GoalHeader, GoalTitle, GoalValue, GoalTrack, GoalHint };
