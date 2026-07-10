"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"

import { AdminSidebar } from "@/components/admin-sidebar"
import { requestAdminSignOut } from "@/lib/auth/admin-auth-client"
import {
  adminNavigationItems,
  isAdminNavigationActive,
} from "@/lib/navigation/admin-navigation"
import { cn } from "@workspace/ui/lib/utils"

export function AdminShell({
  activePath,
  children,
}: {
  readonly activePath?: string
  readonly children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const currentPath = activePath ?? pathname

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar activePath={currentPath} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-surface px-5 py-4 md:hidden">
          <Link className="text-[1.25rem] font-bold text-foreground" href="/">
            글결 어드민
          </Link>
          <button
            className="text-[0.875rem] font-bold text-destructive disabled:opacity-60"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await requestAdminSignOut()
                router.replace("/login")
              })
            }}
            type="button"
          >
            로그아웃
          </button>
        </header>
        <nav
          aria-label="어드민 모바일 메뉴"
          className="flex gap-1 overflow-x-auto bg-surface/60 px-3 py-2 md:hidden"
        >
          {adminNavigationItems.map((item) => {
            const isActive = isAdminNavigationActive(
              currentPath,
              item.href,
              item.end
            )
            const Icon = item.icon

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-3xl px-3 py-2 text-[0.8125rem] font-bold transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground"
                )}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden="true" size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <main
          className={cn(
            "an-fi w-full flex-1",
            currentPath.startsWith("/resources")
              ? "flex min-h-0 max-w-none overflow-hidden"
              : "mx-auto max-w-6xl px-5 py-8 md:px-10"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
