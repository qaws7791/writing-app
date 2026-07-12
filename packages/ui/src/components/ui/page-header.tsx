import * as React from "react"

import { cn } from "#ui/lib/utils"

type PageHeaderProps = React.ComponentProps<"header"> & {
  readonly actions?: React.ReactNode
  readonly description?: React.ReactNode
  readonly title: React.ReactNode
}

function PageHeader({
  actions,
  className,
  description,
  title,
  ...props
}: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "mb-7 flex items-start justify-between gap-5 text-foreground max-md:grid",
        className
      )}
      {...props}
    >
      <div className="grid gap-2">
        <h1 className="m-0 text-heading-lg font-black tracking-normal">
          {title}
        </h1>
        {description === undefined ? null : (
          <p className="m-0 max-w-3xl text-body-lg font-semibold text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions === undefined ? null : (
        <div
          data-slot="page-header-actions"
          className="flex shrink-0 flex-wrap justify-end gap-2"
        >
          {actions}
        </div>
      )}
    </header>
  )
}

export { PageHeader }
