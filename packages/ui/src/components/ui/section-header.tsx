import * as React from "react"

import { cn } from "../../lib/utils"

type SectionHeaderProps = React.ComponentProps<"div"> & {
  readonly actions?: React.ReactNode
  readonly description?: React.ReactNode
  readonly title: React.ReactNode
}

function SectionHeader({
  actions,
  className,
  description,
  title,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      data-slot="section-header"
      className={cn(
        "mb-5 flex items-start justify-between gap-4 text-fg-default max-md:grid",
        className
      )}
      {...props}
    >
      <div className="grid gap-1.5">
        <h2 className="m-0 text-title-lg font-black tracking-normal">
          {title}
        </h2>
        {description === undefined ? null : (
          <p className="m-0 text-body-sm font-semibold text-fg-muted">
            {description}
          </p>
        )}
      </div>
      {actions === undefined ? null : (
        <div
          data-slot="section-header-actions"
          className="flex shrink-0 flex-wrap justify-end gap-2"
        >
          {actions}
        </div>
      )}
    </div>
  )
}

export { SectionHeader }
