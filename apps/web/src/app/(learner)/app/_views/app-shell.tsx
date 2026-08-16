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
    <div className="flex min-h-svh flex-col overflow-x-clip bg-background text-foreground">
      <GlobalNav {...navigationPathProps} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pt-10 pb-28 sm:px-8 sm:py-12">
        {children}
      </main>
      <MobileNav {...navigationPathProps} />
    </div>
  )
}
