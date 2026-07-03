import type { ReactNode } from "react"

function ViewportFrame({
  children,
  label,
  width,
}: {
  readonly children: ReactNode
  readonly label: string
  readonly width: string
}) {
  return (
    <section className="grid gap-2">
      <span className="text-label-sm font-black text-muted-foreground">
        {label}
      </span>
      <div
        className="overflow-hidden rounded-panel border border-border/50 bg-background"
        style={{ width }}
      >
        {children}
      </div>
    </section>
  )
}

export { ViewportFrame }
