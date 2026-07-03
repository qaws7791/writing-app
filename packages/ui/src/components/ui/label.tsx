"use client"

import * as React from "react"

import { cn } from "../../lib/utils"

/**
 * `Label` 컴포넌트는 폼 요소에 대한 설명 텍스트를 제공하는 데 사용됩니다.
 *
 * @example
 * ```tsx
 * <Label htmlFor="username">Username</Label>
 * <input id="username" type="text" />
 * ```
 */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
