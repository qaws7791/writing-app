import type { ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

export function AdminPageHeader({
  actions,
  className,
  description,
  title,
}: {
  readonly actions?: ReactNode
  readonly className?: string
  readonly description?: ReactNode
  readonly title: ReactNode
}) {
  return (
    <header
      className={cn(
        "mb-7 flex items-start justify-between gap-5 max-md:flex-col",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-balance">
          {title}
        </h1>
        {description === undefined ? null : (
          <p className="max-w-3xl text-sm leading-6 text-pretty text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions === undefined ? null : (
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {actions}
        </div>
      )}
    </header>
  )
}
