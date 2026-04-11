"use client"

import { Progress } from "@base-ui/react/progress"
import { cn } from "@workspace/ui/lib/utils"

export interface LinearProgressProps {
  value?: number
  indeterminate?: boolean
  className?: string
}

function LinearProgress({
  value,
  indeterminate,
  className,
}: LinearProgressProps) {
  return (
    <Progress.Root
      data-slot="linear-progress"
      value={indeterminate ? null : (value ?? null)}
      className={cn(
        "relative h-1 w-full overflow-hidden rounded-full",
        className
      )}
    >
      <Progress.Track className="h-full w-full bg-secondary-container">
        <Progress.Indicator
          className={cn(
            "h-full rounded-full bg-primary",
            indeterminate
              ? "w-2/5 animate-[indeterminate_1.5s_var(--ease-standard)_infinite]"
              : "duration-medium2 transition-[width] ease-standard"
          )}
        />
      </Progress.Track>
    </Progress.Root>
  )
}

export { LinearProgress }
