import * as React from "react"

import { fieldControlVariants } from "#ui/lib/field-control-variants"
import { cn } from "#ui/lib/utils"

/**
 * `Textarea` 컴포넌트는 사용자가 여러 줄의 텍스트를 입력할 수 있는 입력 필드를 제공합니다.
 *
 * @example
 * ```tsx
 * <Textarea placeholder="Enter your text here..." />
 * ```
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        fieldControlVariants(),
        "field-sizing-content flex min-h-16 resize-none rounded-2xl px-3 py-3 text-base md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
