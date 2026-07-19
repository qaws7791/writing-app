"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"
import { useState } from "react"

import { AdminSidebar } from "@/app/(admin)/_views/admin-sidebar"
import { requestAdminSignOut } from "@/features/authentication/api/admin-auth-client"
import type { AdminApiBaseUrl } from "@/shared/config/admin-api-url"
import {
  adminNavigationItems,
  isAdminNavigationActive,
} from "@/app/(admin)/_views/admin-navigation"
import { cn } from "@workspace/ui/lib/utils"

export function AdminShell({
  activePath,
  apiBaseUrl,
  children,
  learnerWebOrigin,
}: {
  readonly activePath?: string
  readonly apiBaseUrl: AdminApiBaseUrl
  readonly children: ReactNode
  readonly learnerWebOrigin: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const currentPath = activePath ?? pathname

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar
        activePath={currentPath}
        isSigningOut={isPending}
        learnerWebOrigin={learnerWebOrigin}
        onSignOut={signOut}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-surface px-5 py-4 md:hidden">
          <Link className="text-[1.25rem] font-bold text-foreground" href="/">
            글결 어드민
          </Link>
          <button
            className="text-[0.875rem] font-bold text-destructive disabled:opacity-60"
            disabled={isPending}
            onClick={signOut}
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
        {signOutError === null ? null : (
          <p
            className="mx-5 mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive md:mx-10"
            role="alert"
          >
            {signOutError}
          </p>
        )}
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

  function signOut() {
    startTransition(async () => {
      setSignOutError(null)
      try {
        await requestAdminSignOut(apiBaseUrl)
        router.replace("/login")
      } catch {
        setSignOutError(
          "로그아웃하지 못했습니다. 연결을 확인하고 다시 시도해 주세요."
        )
      }
    })
  }
}
