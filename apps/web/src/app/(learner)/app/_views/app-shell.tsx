import type { ReactNode } from "react"

import { GlobalNav } from "@/app/(learner)/app/_views/global-nav"
import { MobileNav } from "@/app/(learner)/app/_views/mobile-nav"

type AppShellProps = {
  readonly children: ReactNode
  readonly currentPath?: string
}

export function AppShell({ children, currentPath }: AppShellProps) {
  const navigationPathProps = currentPath === undefined ? {} : { currentPath }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <GlobalNav {...navigationPathProps} />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-12 pb-24 pt-8 an-fi">
        {children}
      </main>
      <MobileNav {...navigationPathProps} />
    </div>
  )
}
