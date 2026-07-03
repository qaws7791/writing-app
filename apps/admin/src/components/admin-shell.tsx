"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

import { AdminSidebar } from "@/components/admin-sidebar"

export function AdminShell({
  activePath,
  children,
}: {
  readonly activePath?: string
  readonly children: ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="grid min-h-screen grid-cols-[256px_minmax(0,1fr)] bg-background text-foreground max-[860px]:grid-cols-1">
      <AdminSidebar activePath={activePath ?? pathname} />
      <div className="mx-auto w-full min-w-0 max-w-6xl px-5 py-8 pb-14 md:px-10">
        {children}
      </div>
    </div>
  )
}
