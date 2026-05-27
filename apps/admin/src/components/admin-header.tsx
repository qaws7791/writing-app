"use client"

import * as React from "react"

import { SidebarTrigger } from "@workspace/ui/components/ui/sidebar"

type AdminHeaderProps = {
  actions?: React.ReactNode
  description?: string
  title: string
}

export function AdminHeader({ actions, description, title }: AdminHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-medium">{title}</h1>
          {description ? (
            <p className="truncate text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  )
}
