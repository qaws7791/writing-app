import * as React from "react"

import { cn } from "../../lib/utils"

function StatGrid({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="stat-grid"
      className={cn(
        "grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1",
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
        "grid content-start gap-1 overflow-hidden rounded-2xl bg-bg-surface px-5 py-3.5 text-fg-default",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-label-md font-bold text-fg-muted">
        {icon}
        <span>{label}</span>
      </div>
      <strong className="text-title-lg font-black leading-tight">
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
