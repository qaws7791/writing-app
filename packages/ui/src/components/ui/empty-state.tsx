import * as React from "react"

import { cn } from "../../lib/utils"

type EmptyStateProps = React.ComponentProps<"div"> & {
  readonly actions?: React.ReactNode
  readonly description?: React.ReactNode
  readonly icon?: React.ReactNode
  readonly title: React.ReactNode
}

function EmptyState({
  actions,
  className,
  description,
  icon,
  title,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "grid min-h-64 place-items-center gap-3 rounded-panel border border-dashed border-border-default bg-bg-surface p-(--surface-padding-lg) text-center text-fg-default",
        className
      )}
      {...props}
    >
      <div className="grid justify-items-center gap-3">
        {icon === undefined ? null : (
          <div className="grid size-12 place-items-center rounded-control bg-bg-surface-hover text-fg-muted">
            {icon}
          </div>
        )}
        <div className="grid gap-1.5">
          <strong className="text-title-lg font-black">{title}</strong>
          {description === undefined ? null : (
            <p className="m-0 max-w-md text-body-sm font-semibold text-fg-muted">
              {description}
            </p>
          )}
        </div>
        {actions === undefined ? null : (
          <div className="flex flex-wrap justify-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}

export { EmptyState }
