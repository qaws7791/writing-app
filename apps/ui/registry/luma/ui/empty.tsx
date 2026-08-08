import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";

const emptyVariants = cva(
  "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-5 text-center text-balance",
  {
    variants: {
      variant: {
        // Nothing here yet, so the space itself does the talking.
        default: "px-6 py-16",
        frame: "rounded-3xl border border-border bg-surface/60 px-6 py-14",
        compact: "px-4 py-8 gap-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Empty({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyVariants>) {
  return (
    <div
      data-slot="empty"
      data-variant={variant}
      className={cn(emptyVariants({ variant }), className)}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-2", className)}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  "mb-1 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "size-11 rounded-2xl border border-border/70 bg-card text-foreground/70 shadow-xs [&_svg:not([class*='size-'])]:size-5",
        // Blank sheets waiting to be filled: a hint of the work to come
        // rather than a sign that says there is nothing.
        sheets: "relative mb-3 h-16 w-28 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function EmptyMedia({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-media"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant }), className)}
      {...props}
    >
      {variant === "sheets" ? (
        <>
          <span
            aria-hidden
            className="absolute inset-x-6 top-2 h-13 -rotate-6 rounded-xl border border-border/70 bg-card/70"
          />
          <span
            aria-hidden
            className="absolute inset-x-6 top-1 h-13 rotate-4 rounded-xl border border-border/70 bg-card shadow-xs"
          />
          <span className="absolute inset-0 flex items-center justify-center text-foreground/60">
            {children}
          </span>
        </>
      ) : (
        children
      )}
    </div>
  );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      className={cn("font-heading text-lg font-semibold tracking-[-0.018em]", className)}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "max-w-sm text-sm/relaxed text-pretty text-muted-foreground [&>a]:underline [&>a]:decoration-muted-foreground/40 [&>a]:underline-offset-[0.3em] [&>a:hover]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-3 text-sm text-balance",
        className,
      )}
      {...props}
    />
  );
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
  emptyVariants,
  emptyMediaVariants,
};
