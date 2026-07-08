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
  readonly layout?: "compact" | "metric" | "profile"
  readonly value: React.ReactNode
}

function StatCard({
  className,
  detail,
  icon,
  label,
  layout = "metric",
  value,
  ...props
}: StatCardProps) {
  if (layout === "compact") {
    return (
      <article
        data-slot="stat-card"
        className={cn(
          "flex items-center gap-3 overflow-hidden rounded-2xl bg-surface px-5 py-3.5 text-foreground",
          className
        )}
        {...props}
      >
        {icon === undefined ? null : (
          <div className="shrink-0 text-muted-foreground">{icon}</div>
        )}
        <div className="flex flex-col">
          <strong className="text-title-lg font-black leading-none">
            {value}
          </strong>
          <span className="mt-1.5 text-caption font-bold text-muted-foreground">
            {label}
          </span>
          {detail === undefined ? null : (
            <small className="mt-1 text-body-sm font-semibold text-muted-foreground">
              {detail}
            </small>
          )}
        </div>
      </article>
    )
  }

  if (layout === "profile") {
    return (
      <article
        data-slot="stat-card"
        className={cn(
          "flex flex-col items-center overflow-hidden rounded-4xl bg-surface p-8 text-center text-foreground",
          className
        )}
        {...props}
      >
        <span className="mb-2 text-body-sm font-bold text-muted-foreground">
          {label}
        </span>
        <strong className="text-heading-lg font-black leading-tight">
          {value}
        </strong>
        {detail === undefined ? null : (
          <p className="mt-1 text-label-md font-medium text-muted-foreground">
            {detail}
          </p>
        )}
      </article>
    )
  }

  return (
    <article
      data-slot="stat-card"
      className={cn(
        "overflow-hidden rounded-4xl border border-surface-hover p-6 text-foreground",
        className
      )}
      {...props}
    >
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        {icon === undefined ? null : <span className="shrink-0">{icon}</span>}
        <span className="text-body-sm font-bold">{label}</span>
      </div>
      <strong className="text-heading-lg font-bold leading-tight">
        {value}
      </strong>
      {detail === undefined ? null : (
        <p className="mt-1 text-label-md font-medium text-muted-foreground">
          {detail}
        </p>
      )}
    </article>
  )
}

export { StatCard, StatGrid }
