import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";

type OutlineBlockKind = "intro" | "body" | "conclusion" | "claim" | "evidence" | "example";

const OUTLINE_BLOCK_KIND_LABELS: Record<OutlineBlockKind, string> = {
  intro: "서론",
  body: "본론",
  conclusion: "결론",
  claim: "주장",
  evidence: "근거",
  example: "예시",
};

function Outline({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="outline"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  );
}

function OutlineHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="outline-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  );
}

function OutlineTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="outline-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function OutlineHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="outline-hint"
      className={cn("text-xs leading-5 text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}

function OutlineList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol data-slot="outline-list" className={cn("flex flex-col gap-1.5", className)} {...props} />
  );
}

const outlineBlockVariants = cva(
  "grid grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_auto] items-start gap-x-2.5 gap-y-1 rounded-2xl border border-border/70 bg-card px-2.5 py-2.5",
  {
    variants: {
      kind: {
        intro: "",
        body: "",
        conclusion: "",
        claim: "border-foreground/15",
        evidence: "",
        example: "",
      },
    },
    defaultVariants: {
      kind: "body",
    },
  },
);

function OutlineBlock({
  className,
  kind = "body",
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof outlineBlockVariants> & {
    kind?: OutlineBlockKind;
  }) {
  return (
    <li
      data-slot="outline-block"
      data-kind={kind}
      className={cn(outlineBlockVariants({ kind }), className)}
      {...props}
    >
      {children}
    </li>
  );
}

function OutlineBlockHandle({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="outline-block-handle"
      aria-hidden
      className={cn(
        "row-start-1 mt-1 flex size-5 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground/60",
        "before:block before:h-2.5 before:w-0.5 before:rounded-full before:bg-current before:shadow-[3px_0_0_currentColor,-3px_0_0_currentColor]",
        className,
      )}
      {...props}
    />
  );
}

function OutlineBlockLabel({
  className,
  kind = "body",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  kind?: OutlineBlockKind;
}) {
  return (
    <div
      data-slot="outline-block-label"
      data-kind={kind}
      className={cn(
        "col-start-2 row-start-1 min-w-0 text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    >
      {children ?? OUTLINE_BLOCK_KIND_LABELS[kind]}
    </div>
  );
}

function OutlineBlockBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="outline-block-body"
      className={cn(
        "col-start-2 row-start-2 min-w-0 text-sm leading-6 text-pretty tracking-[-0.01em]",
        className,
      )}
      {...props}
    />
  );
}

function OutlineBlockActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="outline-block-actions"
      className={cn("col-start-3 row-start-1 flex shrink-0 items-center gap-1", className)}
      {...props}
    />
  );
}

export {
  Outline,
  OutlineHeader,
  OutlineTitle,
  OutlineHint,
  OutlineList,
  OutlineBlock,
  OutlineBlockHandle,
  OutlineBlockLabel,
  OutlineBlockBody,
  OutlineBlockActions,
  outlineBlockVariants,
  OUTLINE_BLOCK_KIND_LABELS,
  type OutlineBlockKind,
};
