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
        <p className="text-xs leading-5 font-semibold tracking-wide text-muted uppercase">
          오늘의 글감
        </p>
        <span
          className={`text-muted transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
        >
          ▾
        </span>
      </button>
      {!collapsed && (
        <>
          <h2 className="text-lg leading-7 font-semibold text-foreground">
            {title}
          </h2>
          <p className="text-sm leading-6 text-muted">{body}</p>
        </>
      )}
      {collapsed && (
        <h2 className="text-lg leading-7 font-semibold text-foreground">
          {title}
        </h2>
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
