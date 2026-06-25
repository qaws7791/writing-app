import type { ReactNode } from "react"

function RecipeFrame({
  children,
  density,
  label,
}: {
  readonly children: ReactNode
  readonly density: "comfortable" | "compact"
  readonly label: string
}) {
  return (
    <section
      className="grid gap-4 rounded-panel border border-border-subtle bg-bg-canvas p-surface-padding-md"
      data-density={density}
    >
      <div>
        <h3 className="text-title-lg font-black">{label}</h3>
        <p className="text-body-sm font-semibold text-fg-muted">
          같은 semantic token을 사용하고 density만 바꾼다.
        </p>
      </div>
      {children}
    </section>
  )
}

export { RecipeFrame }
