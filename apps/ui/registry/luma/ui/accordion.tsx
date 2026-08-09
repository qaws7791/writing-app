import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";

import { cn } from "@/registry/luma/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b border-border/70 last:border-b-0", className)}
      {...props}
    />
  );
}

function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 rounded-xl border border-transparent py-4 text-left text-sm font-medium tracking-[-0.008em] text-foreground/85 transition-colors outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 aria-disabled:pointer-events-none aria-disabled:opacity-45 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4",
          className,
        )}
        {...props}
      >
        {children}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          data-slot="accordion-trigger-icon"
          className="pointer-events-none mt-px shrink-0 text-muted-foreground transition-[rotate,color] duration-(--motion-duration-overlay) ease-quiet group-hover/accordion-trigger:text-foreground group-aria-expanded/accordion-trigger:-rotate-180"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="h-(--accordion-panel-height) overflow-hidden text-sm transition-[height] duration-(--motion-duration-enter) ease-quiet data-ending-style:h-0 data-ending-style:duration-(--motion-duration-overlay) data-ending-style:ease-quiet-in data-starting-style:h-0"
      {...props}
    >
      <div
        className={cn(
          "origin-top pt-0 pb-5 text-sm leading-6 text-pretty text-muted-foreground transition-[opacity,transform] duration-(--motion-duration-enter) ease-quiet in-data-ending-style:translate-y-1 in-data-ending-style:opacity-0 in-data-ending-style:duration-(--motion-duration-overlay) in-data-ending-style:ease-quiet-in in-data-starting-style:translate-y-1.5 in-data-starting-style:opacity-0 [&_a]:underline [&_a]:decoration-muted-foreground/40 [&_a]:underline-offset-[0.3em] [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
