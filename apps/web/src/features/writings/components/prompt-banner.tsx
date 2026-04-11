"use client"

export function PromptBanner({
  title,
  body,
  collapsed,
  onToggle,
}: {
  title: string
  body: string
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-secondary-container px-5 py-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between"
      >
        <p className="tracking-widest text-label-medium-em text-on-surface-low uppercase">
          오늘의 글감
        </p>
        <span
          className={`text-on-surface-low transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
        >
          ▾
        </span>
      </button>
      {!collapsed && (
        <>
          <h2 className="text-title-medium-em text-on-surface">{title}</h2>
          <p className="text-body-medium text-on-surface-low">{body}</p>
        </>
      )}
      {collapsed && (
        <h2 className="text-title-medium-em text-on-surface">{title}</h2>
      )}
    </section>
  )
}

export function PromptBannerSkeleton() {
  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-secondary-container px-5 py-4">
      <div className="h-3 w-16 animate-pulse rounded bg-on-surface/10" />
      <div className="h-5 w-3/4 animate-pulse rounded bg-on-surface/10" />
      <div className="h-4 w-full animate-pulse rounded bg-on-surface/10" />
    </section>
  )
}
