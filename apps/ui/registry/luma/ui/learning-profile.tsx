"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";

type LearningProfileOptionMode = "single" | "multiple";

function LearningProfile({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="learning-profile"
      className={cn(
        // Form body sections sit closer than major regions; footer gets extra air.
        "flex w-full flex-col gap-6",
        "*:data-[slot=learning-profile-footer]:mt-2",
        className,
      )}
      {...props}
    />
  );
}

function LearningProfileHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="learning-profile-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

function LearningProfileTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learning-profile-title"
      className={cn("text-xl font-semibold tracking-[-0.02em] text-balance", className)}
      {...props}
    />
  );
}

function LearningProfileDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="learning-profile-description"
      className={cn("text-sm leading-6 text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}

function LearningProfileSection({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="learning-profile-section"
      className={cn(
        // Legend does not reliably honor flex gap — spacing lives on label/hint.
        "flex min-w-0 flex-col border-0 p-0",
        className,
      )}
      {...props}
    />
  );
}

function LearningProfileSectionLabel({ className, ...props }: React.ComponentProps<"legend">) {
  return (
    <legend
      data-slot="learning-profile-section-label"
      className={cn(
        // Margin (not flex gap) — legend spacing is unreliable inside flex fieldsets.
        "float-none mb-3 w-full p-0 text-sm font-medium tracking-[-0.01em]",
        className,
      )}
      {...props}
    />
  );
}

function LearningProfileSectionHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="learning-profile-section-hint"
      className={cn(
        "mb-3 text-xs leading-5 text-pretty text-muted-foreground",
        // Label + hint form one meta group; options keep the label/hint mb-3 below.
        "[[data-slot=learning-profile-section-label]+&]:-mt-1.5",
        className,
      )}
      {...props}
    />
  );
}

function LearningProfileOptions({
  className,
  mode = "single",
  ...props
}: React.ComponentProps<"div"> & {
  mode?: LearningProfileOptionMode;
}) {
  return (
    <div
      data-slot="learning-profile-options"
      data-mode={mode}
      role={mode === "single" ? "radiogroup" : "group"}
      className={cn("flex w-full flex-wrap gap-2", className)}
      {...props}
    />
  );
}

const learningProfileOptionVariants = cva(
  "inline-flex min-h-10 items-center justify-center rounded-2xl border px-4 py-2 text-sm font-medium tracking-[-0.005em] transition-[background-color,border-color,color,box-shadow] duration-125 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      selected: {
        true: "border-foreground/20 bg-foreground text-background",
        false: "border-border/80 bg-card text-foreground hover:border-border hover:bg-accent/50",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

function LearningProfileOption({
  className,
  selected = false,
  mode = "single",
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof learningProfileOptionVariants> & {
    selected?: boolean;
    mode?: LearningProfileOptionMode;
  }) {
  return (
    <button
      type="button"
      data-slot="learning-profile-option"
      data-selected={selected || undefined}
      data-mode={mode}
      role={mode === "single" ? "radio" : "checkbox"}
      aria-checked={selected}
      disabled={disabled}
      className={cn(learningProfileOptionVariants({ selected }), className)}
      {...props}
    >
      {children}
    </button>
  );
}

function LearningProfileSummary({ className, ...props }: React.ComponentProps<"dl">) {
  return (
    <dl
      data-slot="learning-profile-summary"
      className={cn(
        "grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2",
        className,
      )}
      {...props}
    />
  );
}

function LearningProfileSummaryRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learning-profile-summary-row"
      className={cn("col-span-2 grid grid-cols-subgrid items-baseline", className)}
      {...props}
    />
  );
}

function LearningProfileSummaryTerm({ className, ...props }: React.ComponentProps<"dt">) {
  return (
    <dt
      data-slot="learning-profile-summary-term"
      className={cn("text-xs leading-5 font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

function LearningProfileSummaryValue({ className, ...props }: React.ComponentProps<"dd">) {
  return (
    <dd
      data-slot="learning-profile-summary-value"
      className={cn(
        "min-w-0 text-sm leading-5 font-medium tracking-[-0.01em] text-pretty",
        className,
      )}
      {...props}
    />
  );
}

function LearningProfileFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="learning-profile-footer"
      className={cn(
        "flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export {
  LearningProfile,
  LearningProfileHeader,
  LearningProfileTitle,
  LearningProfileDescription,
  LearningProfileSection,
  LearningProfileSectionLabel,
  LearningProfileSectionHint,
  LearningProfileOptions,
  LearningProfileOption,
  LearningProfileSummary,
  LearningProfileSummaryRow,
  LearningProfileSummaryTerm,
  LearningProfileSummaryValue,
  LearningProfileFooter,
  learningProfileOptionVariants,
  type LearningProfileOptionMode,
};
