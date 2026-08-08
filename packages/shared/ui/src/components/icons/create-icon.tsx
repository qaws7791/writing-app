import { forwardRef, type ComponentProps } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

export type IconProps = Omit<ComponentProps<typeof HugeiconsIcon>, "icon">

export function createIcon(displayName: string, icon: IconSvgElement) {
  const Icon = forwardRef<SVGSVGElement, IconProps>(function SharedIcon(
    { strokeWidth = 2, ...props },
    ref
  ) {
    return (
      <HugeiconsIcon
        ref={ref}
        icon={icon}
        strokeWidth={strokeWidth}
        {...props}
      />
    )
  })

  Icon.displayName = displayName
  return Icon
}
