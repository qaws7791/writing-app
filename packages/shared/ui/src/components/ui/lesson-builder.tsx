import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

function LessonBuilder({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="lesson-builder"
      className={cn(
        "@container/lesson-builder flex w-full flex-col gap-4",
        className
      )}
      {...props}
    />
  )
}

function LessonBuilderHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="lesson-builder-header"
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-3",
        className
      )}
      {...props}
    />
  )
}

function LessonBuilderTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-builder-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function LessonBuilderMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="lesson-builder-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function LessonBuilderBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-builder-body"
      className={cn(
        "grid min-w-0 gap-3 @3xl/lesson-builder:grid-cols-[minmax(8rem,11rem)_minmax(0,1fr)]",
        className
      )}
      {...props}
    />
  )
}

function LessonBuilderPalette({
  className,
  ...props
}: React.ComponentProps<"aside">) {
  return (
    <aside
      data-slot="lesson-builder-palette"
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-border/70 bg-card px-2.5 py-3",
        className
      )}
      {...props}
    />
  )
}

function LessonBuilderPaletteLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-builder-palette-label"
      className={cn(
        "px-0.5 text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase",
        className
      )}
      {...props}
    />
  )
}

const lessonBuilderPaletteItemVariants = cva(
  "flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25",
  {
    variants: {
      active: {
        true: "border-foreground/15 bg-foreground/[0.04] dark:bg-foreground/[0.06]",
        false: "border-border/70 bg-muted/30 hover:bg-muted/50",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
)

function LessonBuilderPaletteItem({
  className,
  active = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof lessonBuilderPaletteItemVariants> & {
    active?: boolean
  }) {
  return (
    <button
      type="button"
      data-slot="lesson-builder-palette-item"
      data-active={active || undefined}
      className={cn(lessonBuilderPaletteItemVariants({ active }), className)}
      {...props}
    >
      {children}
    </button>
  )
}

function LessonBuilderCanvas({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-builder-canvas"
      className={cn(
        "flex min-h-64 min-w-0 flex-col gap-1.5 rounded-2xl border border-border/70 bg-muted/20 px-3 py-3",
        className
      )}
      {...props}
    />
  )
}

const lessonBuilderStepVariants = cva(
  "group/step grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-2.5 gap-y-1 rounded-2xl border border-border/70 bg-card px-2.5 py-2.5 outline-none transition-[border-color,box-shadow] duration-150",
  {
    variants: {
      selected: {
        true: "border-foreground/15 ring-1 ring-foreground/10",
        false: "hover:border-border",
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
)

function LessonBuilderStep({
  className,
  index,
  selected = false,
  children,
  ref,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof lessonBuilderStepVariants> & {
    index: number
    selected?: boolean
  }) {
  return (
    <div
      ref={ref}
      data-slot="lesson-builder-step"
      data-index={index}
      data-selected={selected || undefined}
      className={cn(lessonBuilderStepVariants({ selected }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

function LessonBuilderStepIndex({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="lesson-builder-step-index"
      className={cn(
        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted/40 text-[11px] font-medium tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

function LessonBuilderStepHandle({
  className,
  ref,
  index,
  "aria-label": ariaLabel = "스텝 이동",
  ...props
}: React.ComponentProps<"button"> & {
  index?: number
}) {
  return (
    <button
      ref={ref}
      type="button"
      data-slot="lesson-builder-step-handle"
      aria-label={ariaLabel}
      aria-roledescription="드래그 핸들"
      className={cn(
        "mt-0.5 flex size-6 shrink-0 touch-none cursor-grab items-center justify-center rounded-full border border-border/70 bg-muted/40 text-[11px] font-medium tabular-nums text-muted-foreground outline-none transition-colors hover:bg-accent/70 hover:text-foreground active:cursor-grabbing focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25",
        className
      )}
      {...props}
    >
      {index}
    </button>
  )
}

function LessonBuilderStepType({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="lesson-builder-step-type"
      className={cn(
        "inline-flex w-fit items-center rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function LessonBuilderStepBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-builder-step-body"
      className={cn(
        "col-start-2 min-w-0 text-sm leading-6 text-pretty",
        className
      )}
      {...props}
    />
  )
}

function LessonBuilderStepActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-builder-step-actions"
      className={cn(
        "col-start-3 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/step:opacity-100 group-focus-within/step:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function LessonBuilderStepEditor({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-builder-step-editor"
      className={cn(
        "col-span-full mt-1 flex flex-col gap-4 border-t border-border/60 pt-3",
        className
      )}
      {...props}
    />
  )
}

function LessonBuilderStepInsert({
  className,
  ref,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      ref={ref}
      type="button"
      data-slot="lesson-builder-step-insert"
      className={cn(
        "group/insert relative flex h-5 w-full items-center justify-center outline-none",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-border/0 transition-colors group-hover/insert:bg-border group-focus-visible/insert:bg-foreground/30"
      />
      <span className="relative z-[1] rounded-full border border-border/0 bg-card px-2 py-0.5 text-[11px] text-muted-foreground opacity-0 transition-[opacity,border-color] group-hover/insert:border-border/70 group-hover/insert:opacity-100 group-focus-visible/insert:border-foreground/20 group-focus-visible/insert:opacity-100">
        스텝 삽입
      </span>
    </button>
  )
}

function LessonBuilderEmpty({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-builder-empty"
      className={cn(
        "flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/10 px-4 py-8 text-center",
        className
      )}
      {...props}
    />
  )
}

function LessonBuilderInspector({
  className,
  ...props
}: React.ComponentProps<"aside">) {
  return (
    <aside
      data-slot="lesson-builder-inspector"
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border/70 bg-card px-3 py-3",
        className
      )}
      {...props}
    />
  )
}

function LessonBuilderInspectorField({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-builder-inspector-field"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

function LessonBuilderInspectorLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-builder-inspector-label"
      className={cn(
        "text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase",
        className
      )}
      {...props}
    />
  )
}

function LessonBuilderInspectorValue({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="lesson-builder-inspector-value"
      className={cn("text-sm leading-6 text-pretty", className)}
      {...props}
    />
  )
}

export {
  LessonBuilder,
  LessonBuilderHeader,
  LessonBuilderTitle,
  LessonBuilderMeta,
  LessonBuilderBody,
  LessonBuilderPalette,
  LessonBuilderPaletteLabel,
  LessonBuilderPaletteItem,
  LessonBuilderCanvas,
  LessonBuilderStep,
  LessonBuilderStepIndex,
  LessonBuilderStepHandle,
  LessonBuilderStepType,
  LessonBuilderStepBody,
  LessonBuilderStepActions,
  LessonBuilderStepEditor,
  LessonBuilderStepInsert,
  LessonBuilderEmpty,
  LessonBuilderInspector,
  LessonBuilderInspectorField,
  LessonBuilderInspectorLabel,
  LessonBuilderInspectorValue,
  lessonBuilderPaletteItemVariants,
  lessonBuilderStepVariants,
}
