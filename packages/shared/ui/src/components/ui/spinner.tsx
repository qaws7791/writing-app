import { LoadingIcon } from "#ui/components/icons/control-icons"
import type { IconProps } from "#ui/components/icons/create-icon"
import { cn } from "#ui/lib/utils"

function Spinner({
  className,
  role,
  "aria-hidden": ariaHidden,
  "aria-label": ariaLabel,
  ...props
}: IconProps) {
  const isHidden = ariaHidden === true || ariaHidden === "true"

  return (
    <LoadingIcon
      strokeWidth={1.75}
      data-slot="spinner"
      role={isHidden ? undefined : (role ?? "status")}
      aria-hidden={ariaHidden}
      aria-label={isHidden ? undefined : (ariaLabel ?? "로딩 중")}
      className={cn(
        "size-4 animate-spin text-muted-foreground [animation-duration:900ms] in-data-[slot=button]:text-current",
        className
      )}
      {...props}
    />
  )
}

export { Spinner }
