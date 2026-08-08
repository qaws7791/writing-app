import * as React from "react"

import { cn } from "#ui/lib/utils"

function Reflection({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="reflection"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  )
}

function ReflectionHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="reflection-header"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

function ReflectionTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="reflection-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function ReflectionDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="reflection-description"
      className={cn(
        "text-xs leading-5 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function ReflectionFields({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="reflection-fields"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function ReflectionField({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="reflection-field"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function ReflectionFieldLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="reflection-field-label"
      className={cn(
        "text-xs font-medium tracking-[0.02em] text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function ReflectionFieldInput({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="reflection-field-input"
      className={cn(
        "[&_[data-slot=textarea]]:min-h-24 [&_[data-slot=textarea]]:rounded-2xl",
        className
      )}
      {...props}
    />
  )
}

function ReflectionHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="reflection-hint"
      className={cn(
        "text-xs leading-5 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function ReflectionActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="reflection-actions"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

export {
  Reflection,
  ReflectionHeader,
  ReflectionTitle,
  ReflectionDescription,
  ReflectionFields,
  ReflectionField,
  ReflectionFieldLabel,
  ReflectionFieldInput,
  ReflectionHint,
  ReflectionActions,
}
