"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { cn } from "@/registry/luma/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "squircle peer group/checkbox relative flex size-6 shrink-0 items-center justify-center rounded-[0.6rem] border border-border bg-card shadow-xs transition-[background-color,border-color,box-shadow,color,scale] duration-125 ease-press outline-none after:absolute after:-inset-2 group-has-disabled/field:opacity-45 not-data-checked:not-data-indeterminate:hover:border-foreground/18 not-data-checked:not-data-indeterminate:hover:bg-accent/55 active:not-disabled:scale-[0.94] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-card/70 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-checked:shadow-xs data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground data-disabled:pointer-events-none data-disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        {/* Indeterminate reads as a short ink bar rather than a second glyph. */}
        <span className="hidden size-3.5 items-center justify-center group-data-indeterminate/checkbox:flex">
          <span className="h-0.5 w-2.5 rounded-full bg-current" />
        </span>
        <HugeiconsIcon
          icon={Tick02Icon}
          strokeWidth={2.5}
          className="group-data-indeterminate/checkbox:hidden"
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
