import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";
import { Avatar } from "@/registry/luma/ui/avatar";

const personVariants = cva("group/person flex min-w-0", {
  variants: {
    orientation: {
      horizontal: "flex-row items-center gap-3",
      vertical: "flex-col items-start gap-4",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

function Person({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof personVariants>) {
  return (
    <div
      data-slot="person"
      data-orientation={orientation ?? "horizontal"}
      className={cn(personVariants({ orientation }), className)}
      {...props}
    />
  );
}

function PersonAvatar({ className, size = "sm", ...props }: React.ComponentProps<typeof Avatar>) {
  return <Avatar data-slot="person-avatar" size={size} className={cn(className)} {...props} />;
}

function PersonInfo({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="person-info"
      className={cn("min-w-0 flex-1 group-data-[orientation=vertical]/person:flex-none", className)}
      {...props}
    />
  );
}

function PersonName({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="person-name"
      className={cn(
        "truncate font-medium tracking-[-0.01em]",
        "group-data-[orientation=vertical]/person:font-heading group-data-[orientation=vertical]/person:text-2xl group-data-[orientation=vertical]/person:font-semibold group-data-[orientation=vertical]/person:tracking-[-0.035em] group-data-[orientation=vertical]/person:text-balance sm:group-data-[orientation=vertical]/person:text-3xl",
        className,
      )}
      {...props}
    />
  );
}

function PersonDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="person-description"
      className={cn(
        "truncate text-xs text-muted-foreground",
        "group-data-[orientation=vertical]/person:mt-1 group-data-[orientation=vertical]/person:line-clamp-2 group-data-[orientation=vertical]/person:text-sm group-data-[orientation=vertical]/person:leading-6 group-data-[orientation=vertical]/person:text-pretty",
        className,
      )}
      {...props}
    />
  );
}

export { Person, PersonAvatar, PersonInfo, PersonName, PersonDescription, personVariants };
