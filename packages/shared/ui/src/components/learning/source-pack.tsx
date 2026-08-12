import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type SourceItemKind = "reading" | "stat" | "excerpt" | "external"

const SOURCE_ITEM_KIND_LABELS: Record<SourceItemKind, string> = {
  reading: "읽을거리",
  stat: "통계",
  excerpt: "발췌",
  external: "외부 자료",
}

function SourcePack({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="source-pack"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  )
}

function SourcePackHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="source-pack-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function SourcePackTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="source-pack-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function SourcePackMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="source-pack-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function SourcePackList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="source-pack-list"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

const sourceItemVariants = cva(
  "flex flex-col gap-2 rounded-2xl border border-border/70 bg-card px-3.5 py-3",
  {
    variants: {
      kind: {
        reading: "",
        stat: "",
        excerpt: "",
        external: "",
      },
    },
    defaultVariants: {
      kind: "reading",
    },
  }
)

function SourceItem({
  className,
  kind = "reading",
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof sourceItemVariants> & {
    kind?: SourceItemKind
  }) {
  return (
    <li
      data-slot="source-item"
      data-kind={kind}
      className={cn(sourceItemVariants({ kind }), className)}
      {...props}
    >
      {children}
    </li>
  )
}

function SourceItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="source-item-title"
      className={cn(
        "text-sm font-medium tracking-[-0.01em] text-pretty",
        className
      )}
      {...props}
    />
  )
}

function SourceItemMeta({
  className,
  kind,
  children,
  ...props
}: React.ComponentProps<"p"> & {
  kind?: SourceItemKind
}) {
  return (
    <p
      data-slot="source-item-meta"
      data-kind={kind}
      className={cn("text-[11px] text-muted-foreground", className)}
      {...props}
    >
      {children ?? (kind ? SOURCE_ITEM_KIND_LABELS[kind] : undefined)}
    </p>
  )
}

function SourceItemBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="source-item-body"
      className={cn(
        "text-sm leading-6 text-pretty text-foreground/90 whitespace-pre-wrap",
        className
      )}
      {...props}
    />
  )
}

function SourceItemCitation({
  className,
  ...props
}: React.ComponentProps<"cite">) {
  return (
    <cite
      data-slot="source-item-citation"
      className={cn(
        "not-italic text-xs leading-5 text-muted-foreground before:content-['“'] after:content-['”']",
        className
      )}
      {...props}
    />
  )
}

function SourceItemActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="source-item-actions"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

export {
  SourcePack,
  SourcePackHeader,
  SourcePackTitle,
  SourcePackMeta,
  SourcePackList,
  SourceItem,
  SourceItemTitle,
  SourceItemMeta,
  SourceItemBody,
  SourceItemCitation,
  SourceItemActions,
  sourceItemVariants,
  SOURCE_ITEM_KIND_LABELS,
  type SourceItemKind,
}
