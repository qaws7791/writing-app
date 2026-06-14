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
    <div className="admin-shell">
      <AdminSidebar activePath={activePath ?? pathname} />
      <div className="admin-shell__content">{children}</div>
    </div>
  )
}
