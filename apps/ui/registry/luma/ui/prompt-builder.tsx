import * as React from "react";

import { cn } from "@/registry/luma/lib/utils";

function PromptBuilder({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="prompt-builder"
      className={cn("flex w-full flex-col gap-5", className)}
      {...props}
    />
  );
}

function PromptBuilderHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="prompt-builder-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  );
}

function PromptBuilderTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="prompt-builder-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function PromptBuilderSection({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="prompt-builder-section"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function PromptBuilderSectionTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="prompt-builder-section-title"
      className={cn(
        "text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}

function PromptBuilderField({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="prompt-builder-field"
      className={cn(
        "grid grid-cols-[minmax(5rem,auto)_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 rounded-2xl border border-border/70 bg-card px-3.5 py-2.5",
        className,
      )}
      {...props}
    />
  );
}

function PromptBuilderFieldLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="prompt-builder-field-label"
      className={cn("text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

function PromptBuilderFieldValue({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="prompt-builder-field-value"
      className={cn("text-sm leading-6 text-pretty tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function PromptBuilderConstraints({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="prompt-builder-constraints"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

function PromptBuilderConstraint({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="prompt-builder-constraint"
      className={cn(
        "rounded-2xl border border-border/70 bg-muted/30 px-3.5 py-2.5 text-xs leading-5 text-pretty text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  PromptBuilder,
  PromptBuilderHeader,
  PromptBuilderTitle,
  PromptBuilderSection,
  PromptBuilderSectionTitle,
  PromptBuilderField,
  PromptBuilderFieldLabel,
  PromptBuilderFieldValue,
  PromptBuilderConstraints,
  PromptBuilderConstraint,
};
