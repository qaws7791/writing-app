import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type SkillLevel = "emerging" | "developing" | "secure" | "fluent"

const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  emerging: "입문",
  developing: "익히는 중",
  secure: "안정",
  fluent: "숙련",
}

function SkillMap({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="skill-map"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  )
}

function SkillMapHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="skill-map-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function SkillMapTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skill-map-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function SkillMapMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="skill-map-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function SkillMapList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="skill-map-list"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

const skillNodeVariants = cva(
  "flex flex-col gap-1.5 rounded-2xl border px-3.5 py-3 transition-colors duration-150",
  {
    variants: {
      focus: {
        true: "border-foreground/15 bg-foreground/[0.04] ring-1 ring-foreground/10 dark:bg-foreground/[0.06]",
        false: "border-border/70 bg-card hover:bg-muted/30",
      },
    },
    defaultVariants: {
      focus: false,
    },
  }
)

function SkillNode({
  className,
  level = "emerging",
  focus = false,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof skillNodeVariants> & {
    level?: SkillLevel
    focus?: boolean
  }) {
  return (
    <li
      data-slot="skill-node"
      data-level={level}
      data-focus={focus || undefined}
      className={cn(skillNodeVariants({ focus }), className)}
      {...props}
    />
  )
}

function SkillNodeLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skill-node-label"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function SkillNodeLevel({
  className,
  level = "emerging",
  children,
  ...props
}: React.ComponentProps<"span"> & {
  level?: SkillLevel
}) {
  return (
    <span
      data-slot="skill-node-level"
      data-level={level}
      className={cn(
        "inline-flex w-fit items-center rounded-full border border-border/80 bg-card px-2 py-0.5 text-[11px] font-medium tracking-[0.02em] text-muted-foreground",
        className
      )}
      {...props}
    >
      {children ?? SKILL_LEVEL_LABELS[level]}
    </span>
  )
}

function SkillNodePrereq({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="skill-node-prereq"
      className={cn(
        "text-xs leading-5 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function SkillNodeFocus({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="skill-node-focus"
      className={cn(
        "inline-flex w-fit items-center rounded-full border border-foreground/15 bg-foreground/[0.04] px-2 py-0.5 text-[11px] font-medium tracking-[0.02em] text-foreground/80",
        className
      )}
      {...props}
    />
  )
}

export {
  SkillMap,
  SkillMapHeader,
  SkillMapTitle,
  SkillMapMeta,
  SkillMapList,
  SkillNode,
  SkillNodeLabel,
  SkillNodeLevel,
  SkillNodePrereq,
  SkillNodeFocus,
  skillNodeVariants,
  SKILL_LEVEL_LABELS,
  type SkillLevel,
}
