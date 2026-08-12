import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "#ui/lib/utils"

type PathNodeState = "locked" | "available" | "current" | "completed"

function Path({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="path"
      className={cn("mx-auto flex w-full max-w-md flex-col", className)}
      {...props}
    />
  )
}

function PathUnit({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="path-unit"
      className={cn("flex flex-col gap-5 py-6 first:pt-0 last:pb-0", className)}
      {...props}
    />
  )
}

function PathUnitHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="path-unit-header"
      className={cn("flex flex-col gap-1.5 px-1", className)}
      {...props}
    />
  )
}

function PathUnitTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="path-unit-title"
      className={cn(
        "font-heading text-lg font-semibold tracking-[-0.02em]",
        className
      )}
      {...props}
    />
  )
}

function PathUnitDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="path-unit-description"
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  )
}

function PathTrail({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="path-trail"
      className={cn("relative flex flex-col items-center gap-0", className)}
      {...props}
    />
  )
}

function PathConnector({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      data-slot="path-connector"
      className={cn("h-6 w-px bg-border", className)}
      {...props}
    />
  )
}

const pathNodeVariants = cva(
  "group/path-node relative flex size-14 items-center justify-center rounded-full border text-sm font-medium tracking-[-0.01em] transition-[background-color,border-color,color,box-shadow,scale] duration-125 ease-press outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 active:scale-98 disabled:pointer-events-none",
  {
    variants: {
      state: {
        locked: "border-border/70 bg-muted/50 text-muted-foreground",
        available:
          "border-border bg-card text-foreground shadow-xs hover:bg-accent/50",
        current:
          "border-primary/40 bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/10",
        completed:
          "border-foreground/20 bg-foreground text-background shadow-xs",
      },
    },
    defaultVariants: {
      state: "available",
    },
  }
)

function PathNode({
  className,
  state = "available",
  render,
  ...props
}: useRender.ComponentProps<"button"> &
  VariantProps<typeof pathNodeVariants> & {
    state?: PathNodeState
  }) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        type: "button",
        className: cn(pathNodeVariants({ state }), className),
        disabled: state === "locked",
      },
      props
    ),
    render,
    state: {
      slot: "path-node",
      state,
    },
  })
}

function PathNodeMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="path-node-meta"
      className={cn("mt-2 max-w-36 text-center", className)}
      {...props}
    />
  )
}

function PathNodeTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="path-node-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function PathNodeDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="path-node-description"
      className={cn(
        "mt-0.5 text-xs leading-5 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function PathStep({
  className,
  children,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="path-step"
      className={cn("flex flex-col items-center", className)}
      {...props}
    >
      {children}
    </li>
  )
}

export {
  Path,
  PathUnit,
  PathUnitHeader,
  PathUnitTitle,
  PathUnitDescription,
  PathTrail,
  PathStep,
  PathConnector,
  PathNode,
  PathNodeMeta,
  PathNodeTitle,
  PathNodeDescription,
  pathNodeVariants,
}
export type { PathNodeState }
