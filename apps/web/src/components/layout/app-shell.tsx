import type { ReactNode } from "react"

import { GlobalNav, MobileNav } from "@/components/layout/global-nav"

type AppShellProps = {
  readonly children: ReactNode
  readonly currentPath?: string
}

export function AppShell({ children, currentPath }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas text-fg-default">
      <GlobalNav currentPath={currentPath} />
      <main className="flex-1 w-full max-w-6xl mx-auto px-5 md:px-10 pt-6 pb-24 an-fi">
        {children}
      </main>
      <MobileNav currentPath={currentPath} />
    </div>
  )
}
