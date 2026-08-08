import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type ExemplarKind = "good" | "borderline" | "counter"

const EXEMPLAR_KIND_LABELS: Record<ExemplarKind, string> = {
  good: "우수",
  borderline: "경계",
  counter: "반례",
}

function ExemplarLibrary({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="exemplar-library"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  )
}

function ExemplarLibraryHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="exemplar-library-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function ExemplarLibraryTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="exemplar-library-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function ExemplarList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="exemplar-list"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

const exemplarVariants = cva(
  "flex flex-col gap-3 rounded-2xl border px-3.5 py-3",
  {
    variants: {
      kind: {
        good: "border-foreground/15 bg-card",
        borderline: "border-border/70 bg-muted/30",
        counter: "border-border/70 bg-card",
      },
    },
    defaultVariants: {
      kind: "good",
    },
  }
)

function Exemplar({
  className,
  kind = "good",
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof exemplarVariants> & {
    kind?: ExemplarKind
  }) {
  return (
    <li
      data-slot="exemplar"
      data-kind={kind}
      className={cn(exemplarVariants({ kind }), className)}
      {...props}
    >
      {children}
    </li>
  )
}

function ExemplarTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="exemplar-title"
      className={cn(
        "text-sm font-medium tracking-[-0.01em] text-pretty",
        className
      )}
      {...props}
    />
  )
}

function ExemplarMeta({
  className,
  kind,
  children,
  ...props
}: React.ComponentProps<"p"> & {
  kind?: ExemplarKind
}) {
  return (
    <p
      data-slot="exemplar-meta"
      data-kind={kind}
      className={cn(
        "text-[11px] tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    >
      {children ?? (kind ? EXEMPLAR_KIND_LABELS[kind] : undefined)}
    </p>
  )
}

function ExemplarBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="exemplar-body"
      className={cn(
        "rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-sm leading-6 text-pretty",
        className
      )}
      {...props}
    />
  )
}

function ExemplarAnnotations({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="exemplar-annotations"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function ExemplarAnnotation({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="exemplar-annotation"
      className={cn(
        "rounded-xl border border-border/70 bg-card px-3 py-2 text-xs leading-5 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function ExemplarActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="exemplar-actions"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  )
}

export {
  ExemplarLibrary,
  ExemplarLibraryHeader,
  ExemplarLibraryTitle,
  ExemplarList,
  Exemplar,
  ExemplarTitle,
  ExemplarMeta,
  ExemplarBody,
  ExemplarAnnotations,
  ExemplarAnnotation,
  ExemplarActions,
  exemplarVariants,
  EXEMPLAR_KIND_LABELS,
  type ExemplarKind,
}
