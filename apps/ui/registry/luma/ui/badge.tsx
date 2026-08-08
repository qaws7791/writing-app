import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-5.5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 text-xs font-semibold tracking-[0.005em] whitespace-nowrap transition-[background-color,border-color,color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/88",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-accent",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/10 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/12",
        success:
          "bg-success/10 text-success focus-visible:ring-success/20 dark:bg-success/10 dark:focus-visible:ring-success/40 [a]:hover:bg-success/12",
        warning:
          "bg-warning/10 text-warning focus-visible:ring-warning/20 dark:bg-warning/10 dark:focus-visible:ring-warning/40 [a]:hover:bg-warning/12",
        info: "bg-info/10 text-info focus-visible:ring-info/20 dark:bg-info/10 dark:focus-visible:ring-info/40 [a]:hover:bg-info/12",
        purple:
          "bg-purple/10 text-purple focus-visible:ring-purple/20 dark:bg-purple/10 dark:focus-visible:ring-purple/40 [a]:hover:bg-purple/12",
        outline:
          "border-border bg-card/60 text-foreground/85 [a]:hover:border-border [a]:hover:bg-accent/60 [a]:hover:text-foreground",
        ghost:
          "text-muted-foreground hover:bg-accent/70 hover:text-foreground dark:hover:bg-accent/60",
        link: "text-foreground underline decoration-foreground/25 underline-offset-[0.3em] hover:decoration-foreground/70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
