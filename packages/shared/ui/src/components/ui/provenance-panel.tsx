import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type ProvenanceSource = "human" | "ai" | "external"

const PROVENANCE_SOURCE_LABELS: Record<ProvenanceSource, string> = {
  human: "사람 작성",
  ai: "AI 생성",
  external: "외부 출처",
}

function ProvenancePanel({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="provenance-panel"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  )
}

function ProvenancePanelHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="provenance-panel-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function ProvenancePanelTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="provenance-panel-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function ProvenanceList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="provenance-list"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

const provenanceRowVariants = cva(
  "grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 rounded-2xl border border-border/70 bg-card px-3.5 py-3",
  {
    variants: {
      source: {
        human: "",
        ai: "",
        external: "",
      },
      verified: {
        true: "",
        false: "border-dashed",
      },
    },
    defaultVariants: {
      source: "human",
      verified: true,
    },
  }
)

function ProvenanceRow({
  className,
  source = "human",
  verified = true,
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof provenanceRowVariants> & {
    source?: ProvenanceSource
    verified?: boolean
  }) {
  return (
    <li
      data-slot="provenance-row"
      data-source={source}
      data-verified={verified || undefined}
      className={cn(provenanceRowVariants({ source, verified }), className)}
      {...props}
    >
      {children}
    </li>
  )
}

const provenanceSourceVariants = cva(
  "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-[0.04em] uppercase",
  {
    variants: {
      source: {
        human: "border-border/80 bg-card text-muted-foreground",
        ai: "border-border/80 bg-muted/50 text-foreground/70",
        external: "border-border/80 bg-card text-muted-foreground",
      },
    },
    defaultVariants: {
      source: "human",
    },
  }
)

function ProvenanceRowLabel({
  className,
  source = "human",
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof provenanceSourceVariants> & {
    source?: ProvenanceSource
  }) {
  return (
    <span
      data-slot="provenance-row-label"
      data-source={source}
      className={cn(provenanceSourceVariants({ source }), className)}
      {...props}
    >
      {children ?? PROVENANCE_SOURCE_LABELS[source]}
    </span>
  )
}

function ProvenanceRowMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="provenance-row-meta"
      className={cn(
        "col-start-2 text-xs leading-5 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function ProvenanceRowModel({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="provenance-row-model"
      className={cn(
        "col-start-2 text-[11px] font-mono tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

const provenanceRowStatusVariants = cva("text-[11px] font-medium", {
  variants: {
    verified: {
      true: "text-foreground/70",
      false: "text-muted-foreground",
    },
  },
  defaultVariants: {
    verified: true,
  },
})

function ProvenanceRowStatus({
  className,
  verified = true,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof provenanceRowStatusVariants>) {
  return (
    <span
      data-slot="provenance-row-status"
      data-verified={verified || undefined}
      className={cn(
        provenanceRowStatusVariants({ verified }),
        "col-start-3 row-span-2 shrink-0",
        className
      )}
      {...props}
    >
      {children ?? (verified ? "확인됨" : "미확인")}
    </span>
  )
}

function ProvenanceRowActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="provenance-row-actions"
      className={cn(
        "col-start-3 flex flex-wrap items-center gap-1.5",
        className
      )}
      {...props}
    />
  )
}

export {
  ProvenancePanel,
  ProvenancePanelHeader,
  ProvenancePanelTitle,
  ProvenanceList,
  ProvenanceRow,
  ProvenanceRowLabel,
  ProvenanceRowMeta,
  ProvenanceRowModel,
  ProvenanceRowStatus,
  ProvenanceRowActions,
  provenanceRowVariants,
  provenanceSourceVariants,
  provenanceRowStatusVariants,
  PROVENANCE_SOURCE_LABELS,
  type ProvenanceSource,
}
