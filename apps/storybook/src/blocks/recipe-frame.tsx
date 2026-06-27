import type { ReactNode } from "react"

function RecipeFrame({
  children,
  label,
}: {
  readonly children: ReactNode
  readonly label: string
}) {
  return (
    <section className="grid gap-4 rounded-panel border border-border-subtle bg-bg-canvas p-surface-padding-md">
      <div>
        <h3 className="text-title-lg font-black">{label}</h3>
      </div>
      {children}
    </section>
  )
}

export { RecipeFrame }
