import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count?: number
  max?: number
  showZero?: boolean
  invisible?: boolean
  variant?: "small" | "large"
}

function Badge({
  className,
  count,
  max = 99,
  showZero = false,
  invisible = false,
  variant,
  ...props
}: BadgeProps) {
  const hasCount = count !== undefined
  const resolvedVariant = variant ?? (hasCount ? "large" : "small")
  const isSmall = resolvedVariant === "small"

  const displayCount =
    hasCount && !isSmall ? (count > max ? `${max}+` : String(count)) : undefined

  const hidden = invisible || (!showZero && hasCount && count === 0)

  if (hidden) return null

  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-error text-on-error",
        isSmall ? "size-[6px]" : "h-4 min-w-[16px] px-1 text-label-small",
        className
      )}
      aria-label={displayCount ? `${displayCount}건` : undefined}
      {...props}
    >
      {!isSmall && displayCount}
    </span>
  )
}

export { Badge }
