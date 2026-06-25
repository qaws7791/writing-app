import type { ReactNode } from "react"

type StoryMatrixItem = {
  readonly children: ReactNode
  readonly description?: ReactNode
  readonly title: ReactNode
}

function StoryMatrix({
  columns = 3,
  items,
}: {
  readonly columns?: 2 | 3 | 4
  readonly items: readonly StoryMatrixItem[]
}) {
  const gridClassName = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 xl:grid-cols-3",
    4: "md:grid-cols-2 xl:grid-cols-4",
  }[columns]

  return (
    <div className={`grid gap-4 ${gridClassName}`}>
      {items.map((item, index) => (
        <section
          className="grid gap-3 rounded-panel border border-border-subtle bg-bg-surface p-surface-padding-md"
          key={index}
        >
          <div className="grid gap-1">
            <h3 className="text-title-md font-black">{item.title}</h3>
            {item.description === undefined ? null : (
              <p className="text-body-sm font-semibold text-fg-muted">
                {item.description}
              </p>
            )}
          </div>
          <div>{item.children}</div>
        </section>
      ))}
    </div>
  )
}

export { StoryMatrix }
