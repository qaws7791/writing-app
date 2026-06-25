import * as React from "react"
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"

import { ChevronDownIcon } from "../icons"
import { cn } from "../../lib/utils"

function Accordion({
  className,
  ...props
}: AccordionPrimitive.Root.Props<string>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("grid gap-2", className)}
      {...props}
    />
  )
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "group/accordion-item rounded-panel border border-border-subtle bg-bg-surface text-fg-default",
        className
      )}
      {...props}
    />
  )
}

function AccordionHeader({
  className,
  ...props
}: AccordionPrimitive.Header.Props) {
  return (
    <AccordionPrimitive.Header
      data-slot="accordion-header"
      className={cn("m-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  children,
  className,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Trigger
      data-slot="accordion-trigger"
      className={cn(
        "flex min-h-(--control-height-md) w-full items-center justify-between gap-3 rounded-panel px-(--surface-padding-md) py-3 text-left text-sm font-bold transition-colors outline-none hover:bg-bg-surface-hover focus-visible:border-border-focus focus-visible:ring-3 focus-visible:ring-border-focus/20 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span className="min-w-0">{children}</span>
      <ChevronDownIcon
        aria-hidden="true"
        className="size-4 shrink-0 transition-transform duration-(--motion-duration-fast) ease-(--motion-ease-press) group-data-[open]/accordion-item:rotate-180"
      />
    </AccordionPrimitive.Trigger>
  )
}

function AccordionPanel({
  className,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-panel"
      className={cn(
        "px-(--surface-padding-md) pb-(--surface-padding-md) text-sm font-medium text-fg-muted data-[open]:animate-in data-[open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

export {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
}
