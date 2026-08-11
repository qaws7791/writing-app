import type { ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

export function AdminPageHeader({
  actions,
  className,
  description,
}: {
  readonly actions?: ReactNode
  readonly className?: string
  readonly description?: ReactNode
}) {
  if (description === undefined && actions === undefined) {
    return null
  }

  return (
    <header
      className={cn(
        "flex items-start justify-between gap-5 max-md:flex-col",
        className
      )}
    >
      {description === undefined ? (
        <div className="min-w-0 flex-1" />
      ) : (
        <p className="max-w-3xl text-sm leading-6 text-pretty text-muted-foreground">
          {description}
        </p>
      )}
      {actions === undefined ? null : (
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {actions}
        </div>
      )}
    </header>
  )
}
