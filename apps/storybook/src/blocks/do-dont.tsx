import type { ReactNode } from "react"

function DoDont({
  doExample,
  dontExample,
}: {
  readonly doExample: ReactNode
  readonly dontExample: ReactNode
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="grid gap-3 rounded-panel border border-success-fg/25 bg-success p-surface-padding-md text-success-foreground">
        <h3 className="text-title-md font-black">Do</h3>
        {doExample}
      </section>
      <section className="grid gap-3 rounded-panel border border-danger-fg/25 bg-danger p-surface-padding-md text-danger-foreground">
        <h3 className="text-title-md font-black">Do not</h3>
        {dontExample}
      </section>
    </div>
  )
}

export { DoDont }
