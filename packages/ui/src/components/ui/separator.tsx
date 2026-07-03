"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "../../lib/utils"
/**
 * `Separator` 컴포넌트는 콘텐츠를 시각적으로 구분하는 데 사용됩니다.
 *
 * @example
 * ```tsx
 * <Separator orientation="horizontal" />
 * ```
 */
function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
