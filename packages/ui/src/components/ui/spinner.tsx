import * as React from "react"

import { Loader2Icon } from "lucide-react"
import { cn } from "../../lib/utils"

/**
 * `Spinner` 컴포넌트는 로딩 상태를 나타내는 회전하는 아이콘을 제공합니다.
 *
 * @example
 * ```tsx
 * <Spinner />
 * ```
 */
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
