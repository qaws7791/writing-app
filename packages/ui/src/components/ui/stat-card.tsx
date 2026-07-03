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
        "flex items-center gap-3 overflow-hidden rounded-2xl bg-surface px-5 py-4 text-foreground",
        className
      )}
      {...props}
    >
      {icon === undefined ? null : (
        <div className="text-muted-foreground shrink-0">{icon}</div>
      )}
      <div className="flex flex-col">
        <strong className="text-title-lg font-black leading-none">
          {value}
        </strong>
        <span className="text-caption font-bold text-muted-foreground mt-1.5">
          {label}
        </span>
        {detail === undefined ? null : (
          <small className="text-body-sm font-semibold text-muted-foreground mt-1">
            {detail}
          </small>
        )}
      </div>
    </article>
  )
}

export { StatCard, StatGrid }
