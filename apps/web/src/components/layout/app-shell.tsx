import type { ReactNode } from "react"

import { GlobalNav } from "@/components/layout/global-nav"

type AppShellProps = {
  readonly children: ReactNode
  readonly currentPath?: string
}

export function AppShell({ children, currentPath }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <GlobalNav currentPath={currentPath} />
      {children}
    </div>
  )
}
