"use client"

import { Card } from "@workspace/ui/components/ui/card"
import { Skeleton } from "@workspace/ui/components/ui/skeleton"

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
    <Card className="px-5 py-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between"
      >
        <p className="text-xs leading-5 font-semibold tracking-wide text-muted-foreground uppercase">
          오늘의 글감
        </p>
        <span
          className={`text-muted-foreground transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
        >
          ▾
        </span>
      </button>
      {!collapsed && (
        <>
          <h2 className="text-lg leading-7 font-semibold text-foreground">
            {title}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">{body}</p>
        </>
      )}
      {collapsed && (
        <h2 className="text-lg leading-7 font-semibold text-foreground">
          {title}
        </h2>
      )}
    </Card>
  )
}

export function PromptBannerSkeleton() {
  return (
    <Card className="px-5 py-4">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
    </Card>
  )
}
