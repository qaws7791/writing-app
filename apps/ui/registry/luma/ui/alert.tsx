import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";

const alertVariants = cva(
  // A notice, not a colored box: a hairline panel that sits in the page and
  // lets the words carry the weight.
  "group/alert relative grid w-full gap-1 rounded-3xl border px-5 py-4 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-border/80 bg-card text-card-foreground *:[svg]:text-muted-foreground",
        destructive:
          "border-destructive/25 bg-destructive/6 text-destructive *:data-[slot=alert-description]:text-destructive/85 *:[svg]:text-destructive/80 dark:bg-destructive/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium tracking-[-0.01em] group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:decoration-current/30 [&_a]:underline-offset-[0.3em] [&_a]:hover:decoration-current/70",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm leading-6 text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:decoration-current/30 [&_a]:underline-offset-[0.3em] [&_a]:hover:decoration-current/70 [&_p:not(:last-child)]:mb-4",
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-3.5 right-4", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
