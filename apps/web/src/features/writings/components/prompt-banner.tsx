"use client"

import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

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
    <Card.Root variant="secondary" className="px-5 py-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between"
      >
        <p className="text-label-medium-em text-on-surface-low tracking-widest uppercase">
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
    </Card.Root>
  )
}

export function PromptBannerSkeleton() {
  return (
    <Card.Root variant="secondary" className="px-5 py-4">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
    </Card.Root>
  )
}
