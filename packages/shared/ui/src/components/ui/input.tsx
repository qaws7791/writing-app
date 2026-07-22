import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { fieldControlVariants } from "#ui/lib/field-control-variants"
import { cn } from "#ui/lib/utils"

/**
 * `Input` 컴포넌트는 사용자가 텍스트를 입력할 수 있는 필드입니다.
 *
 * @example
 * ```tsx
 * <Input placeholder="Enter text" />
 * ```
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        fieldControlVariants(),
        "h-11 rounded-3xl px-3 py-1 text-base file:inline-flex file:h-11 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
