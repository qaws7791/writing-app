import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";

type AnnotationKind = "spelling" | "spacing" | "agreement" | "logic" | "expression";
type AnnotationState = "open" | "accepted" | "rejected" | "resolved";

const ANNOTATION_KIND_LABELS: Record<AnnotationKind, string> = {
  spelling: "맞춤법",
  spacing: "띄어쓰기",
  agreement: "문법",
  logic: "논리",
  expression: "표현",
};

const ANNOTATION_STATE_LABELS: Record<AnnotationState, string> = {
  open: "검토 중",
  accepted: "수용",
  rejected: "거절",
  resolved: "해결됨",
};

function TextAnnotation({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="text-annotation"
      className={cn("flex w-full flex-col gap-5 lg:flex-row lg:gap-6", className)}
      {...props}
    />
  );
}

function TextAnnotationDocument({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="text-annotation-document"
      className={cn(
        "min-w-0 flex-1 rounded-3xl border border-border/70 bg-card px-5 py-5 text-base leading-7 text-pretty shadow-2xs sm:px-6 sm:py-6",
        className,
      )}
      {...props}
    />
  );
}

const annotationMarkVariants = cva(
  "rounded-sm px-0.5 underline decoration-2 underline-offset-[0.2em] transition-colors duration-150",
  {
    variants: {
      kind: {
        spelling: "decoration-destructive/60 bg-destructive/10",
        spacing: "decoration-amber-600/50 bg-amber-500/10 dark:decoration-amber-400/50",
        agreement: "decoration-sky-600/50 bg-sky-500/10 dark:decoration-sky-400/50",
        logic: "decoration-orange-600/50 bg-orange-500/10 dark:decoration-orange-400/50",
        expression: "decoration-emerald-600/50 bg-emerald-500/10 dark:decoration-emerald-400/50",
      },
      state: {
        open: "opacity-100",
        accepted: "opacity-60 line-through decoration-foreground/30",
        rejected: "opacity-40",
        resolved: "opacity-50 no-underline",
      },
    },
    defaultVariants: {
      kind: "spelling",
      state: "open",
    },
  },
);

function TextAnnotationMark({
  className,
  kind = "spelling",
  state = "open",
  ...props
}: React.ComponentProps<"mark"> &
  VariantProps<typeof annotationMarkVariants> & {
    kind?: AnnotationKind;
    state?: AnnotationState;
  }) {
  return (
    <mark
      data-slot="text-annotation-mark"
      data-kind={kind}
      data-state={state}
      className={cn(annotationMarkVariants({ kind, state }), className)}
      {...props}
    />
  );
}

function TextAnnotationPanel({ className, ...props }: React.ComponentProps<"aside">) {
  return (
    <aside
      data-slot="text-annotation-panel"
      className={cn("flex w-full shrink-0 flex-col gap-2 lg:w-72", className)}
      {...props}
    />
  );
}

const annotationItemVariants = cva(
  "flex flex-col gap-2 rounded-2xl border px-3.5 py-3 transition-colors duration-150",
  {
    variants: {
      state: {
        open: "border-border/80 bg-card",
        accepted: "border-border/60 bg-muted/30 opacity-80",
        rejected: "border-border/50 bg-muted/20 opacity-70",
        resolved: "border-border/50 bg-muted/20 opacity-60",
      },
    },
    defaultVariants: {
      state: "open",
    },
  },
);

function TextAnnotationItem({
  className,
  kind = "spelling",
  state = "open",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof annotationItemVariants> & {
    kind?: AnnotationKind;
    state?: AnnotationState;
  }) {
  return (
    <div
      data-slot="text-annotation-item"
      data-kind={kind}
      data-state={state}
      className={cn(annotationItemVariants({ state }), className)}
      {...props}
    />
  );
}

function TextAnnotationItemLabel({
  className,
  kind = "spelling",
  state = "open",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  kind?: AnnotationKind;
  state?: AnnotationState;
}) {
  return (
    <div
      data-slot="text-annotation-item-label"
      className={cn(
        "flex items-center justify-between gap-2 text-xs font-medium tracking-[0.02em]",
        className,
      )}
      {...props}
    >
      <span>{children ?? ANNOTATION_KIND_LABELS[kind]}</span>
      <span className="text-muted-foreground">{ANNOTATION_STATE_LABELS[state]}</span>
    </div>
  );
}

function TextAnnotationItemBody({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="text-annotation-item-body"
      className={cn("text-sm leading-6 text-pretty text-foreground/90", className)}
      {...props}
    />
  );
}

function TextAnnotationItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="text-annotation-item-actions"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

export {
  TextAnnotation,
  TextAnnotationDocument,
  TextAnnotationMark,
  TextAnnotationPanel,
  TextAnnotationItem,
  TextAnnotationItemLabel,
  TextAnnotationItemBody,
  TextAnnotationItemActions,
  annotationMarkVariants,
  annotationItemVariants,
  ANNOTATION_KIND_LABELS,
  ANNOTATION_STATE_LABELS,
  type AnnotationKind,
  type AnnotationState,
};
