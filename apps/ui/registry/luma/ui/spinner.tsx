import type { ComponentProps } from "react";

import { cn } from "@/registry/luma/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

function Spinner({ className, ...props }: Omit<ComponentProps<typeof HugeiconsIcon>, "icon">) {
  return (
    <HugeiconsIcon
      icon={Loading03Icon}
      strokeWidth={1.75}
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn(
        "size-4 animate-spin text-muted-foreground [animation-duration:900ms] in-data-[slot=button]:text-current",
        className,
      )}
      {...props}
    />
  );
}

export { Spinner };
