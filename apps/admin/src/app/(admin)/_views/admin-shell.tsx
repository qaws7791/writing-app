"use client"

import type { ReactNode } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"
import { useState } from "react"

import { AdminSidebar } from "@/app/(admin)/_views/admin-sidebar"
import { requestAdminSignOut } from "@/features/authentication/api/admin-auth-client"
import { adminNavigationItems } from "@/app/(admin)/_views/admin-navigation"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"

const AdminMobileSidebar = dynamic(() =>
  import("@/app/(admin)/_views/admin-mobile-sidebar").then(
    (module) => module.AdminMobileSidebar
  )
)

export function AdminShell({
  activePath,
  children,
  learnerWebOrigin,
}: {
  readonly activePath?: string
  readonly children: ReactNode
  readonly learnerWebOrigin: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const currentPath = activePath ?? pathname

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <AdminSidebar
        activePath={currentPath}
        isSigningOut={isPending}
        learnerWebOrigin={learnerWebOrigin}
        navigationItems={adminNavigationItems}
        onSignOut={signOut}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/90 px-5 py-4 backdrop-blur-xl md:hidden">
          <Link
            className="font-heading text-lg font-semibold tracking-[-0.02em] text-foreground"
            href="/"
            prefetch={false}
          >
            글결 어드민
          </Link>
          <AdminMobileSidebar
            activePath={currentPath}
            isSigningOut={isPending}
            learnerWebOrigin={learnerWebOrigin}
            navigationItems={adminNavigationItems}
            onSignOut={signOut}
          />
        </header>
        {signOutError === null ? null : (
          <Alert
            className="mx-5 mt-4 md:mx-10"
            role="alert"
            variant="destructive"
          >
            <AlertDescription>{signOutError}</AlertDescription>
          </Alert>
        )}
        <main className="animate-drift-in mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-10">
          {children}
        </main>
      </div>
    </div>
  )

  function signOut() {
    startTransition(async () => {
      setSignOutError(null)
      try {
        await requestAdminSignOut()
        router.replace("/login")
      } catch {
        setSignOutError(
          "로그아웃하지 못했습니다. 연결을 확인하고 다시 시도해 주세요."
        )
      }
    })
  }
}
