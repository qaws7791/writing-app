import * as React from "react"

import { cn } from "../../lib/utils"

function StatGrid({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="stat-grid"
      className={cn(
        "grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1",
        className
      )}
      {...props}
    />
  )
}

type StatCardProps = React.ComponentProps<"article"> & {
  readonly detail?: React.ReactNode
  readonly icon?: React.ReactNode
  readonly label: React.ReactNode
  readonly value: React.ReactNode
}

function StatCard({
  className,
  detail,
  icon,
  label,
  value,
  ...props
}: StatCardProps) {
  return (
    <article
      data-slot="stat-card"
      className={cn(
        "grid min-h-36 content-start gap-2 overflow-hidden rounded-panel border border-border-subtle bg-bg-surface p-(--surface-padding-md) text-fg-default",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-label-md font-black text-fg-muted">
        {icon}
        <span>{label}</span>
      </div>
      <strong className="text-heading-lg font-black leading-tight">
        {value}
      </strong>
      {detail === undefined ? null : (
        <small className="text-body-sm font-semibold text-fg-muted">
          {detail}
        </small>
      )}
    </article>
  )
}

export { StatCard, StatGrid }
