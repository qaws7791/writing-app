"use client"

import { usePathname } from "next/navigation"

import { GlobalNav } from "@/components/layout/global-nav"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLessonRoute =
    pathname === "/app/lesson" || pathname.startsWith("/app/lesson/")

  if (isLessonRoute) {
    return (
      <div className="min-h-svh bg-background text-foreground">{children}</div>
    )
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <GlobalNav />
      <main className="min-h-svh pb-[calc(4rem+env(safe-area-inset-bottom))] md:pt-14 md:pb-0">
        {children}
      </main>
    </div>
  )
}
