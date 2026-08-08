import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";

type ArgumentNodeKind = "claim" | "evidence" | "counter" | "rebuttal";

const ARGUMENT_NODE_KIND_LABELS: Record<ArgumentNodeKind, string> = {
  claim: "주장",
  evidence: "근거",
  counter: "반론",
  rebuttal: "재반박",
};

function ArgumentMap({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="argument-map"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  );
}

function ArgumentMapHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="argument-map-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  );
}

function ArgumentMapTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="argument-map-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function ArgumentMapHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="argument-map-hint"
      className={cn("text-xs leading-5 text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}

function ArgumentMapCanvas({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="argument-map-canvas"
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/20 px-3.5 py-3",
        className,
      )}
      {...props}
    />
  );
}

const argumentNodeVariants = cva("flex flex-col gap-1.5 rounded-2xl border px-3.5 py-3", {
  variants: {
    kind: {
      claim: "border-foreground/20 bg-card",
      evidence: "border-border/70 bg-card",
      counter: "border-border/70 bg-muted/40",
      rebuttal: "border-border/70 bg-card",
    },
  },
  defaultVariants: {
    kind: "claim",
  },
});

function ArgumentNode({
  className,
  kind = "claim",
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof argumentNodeVariants> & {
    kind?: ArgumentNodeKind;
  }) {
  return (
    <div
      data-slot="argument-node"
      data-kind={kind}
      className={cn(argumentNodeVariants({ kind }), className)}
      {...props}
    >
      {children}
    </div>
  );
}

function ArgumentNodeLabel({
  className,
  kind = "claim",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  kind?: ArgumentNodeKind;
}) {
  return (
    <div
      data-slot="argument-node-label"
      data-kind={kind}
      className={cn(
        "text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    >
      {children ?? ARGUMENT_NODE_KIND_LABELS[kind]}
    </div>
  );
}

function ArgumentNodeBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="argument-node-body"
      className={cn("text-sm leading-6 text-pretty tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function ArgumentEdge({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="argument-edge"
      role="presentation"
      className={cn(
        "flex items-center gap-2 py-0.5 text-xs text-muted-foreground before:h-px before:min-w-4 before:flex-1 before:bg-border/80 after:h-px after:min-w-4 after:flex-1 after:bg-border/80",
        className,
      )}
      {...props}
    >
      <span className="shrink-0 font-medium tracking-[0.02em]">{children}</span>
    </div>
  );
}

export {
  ArgumentMap,
  ArgumentMapHeader,
  ArgumentMapTitle,
  ArgumentMapHint,
  ArgumentMapCanvas,
  ArgumentNode,
  ArgumentNodeLabel,
  ArgumentNodeBody,
  ArgumentEdge,
  argumentNodeVariants,
  ARGUMENT_NODE_KIND_LABELS,
  type ArgumentNodeKind,
};
