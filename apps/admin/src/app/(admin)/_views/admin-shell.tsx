"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"
import { useState } from "react"

import { AdminSidebar } from "@/app/(admin)/_views/admin-sidebar"
import type { AdminProfile } from "@/app/(admin)/_views/admin-profile-menu"
import { AdminShellChromeProvider } from "@/app/(admin)/_views/admin-shell-chrome"
import { AdminShellHeader } from "@/app/(admin)/_views/admin-shell-header"
import { requestAdminSignOut } from "@/features/authentication/api/admin-auth-client"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/ui/sidebar"
import { cn } from "@workspace/ui/lib/utils"

export function AdminShell({
  activePath,
  adminProfile,
  children,
  learnerWebOrigin,
}: {
  readonly activePath?: string
  readonly adminProfile: AdminProfile
  readonly children: ReactNode
  readonly learnerWebOrigin: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const currentPath = activePath ?? pathname

  return (
    <div
      data-slot="admin-shell"
      className="@container/admin-shell relative flex h-svh min-h-0 w-full overflow-hidden bg-background text-foreground"
    >
      <SidebarProvider className="relative flex h-full min-h-0! w-full flex-1 overflow-hidden">
        <AdminShellChromeProvider>
          <AdminSidebar
            activePath={currentPath}
            adminProfile={adminProfile}
            isSigningOut={isPending}
            learnerWebOrigin={learnerWebOrigin}
            onSignOut={signOut}
          />
          <SidebarInset className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <AdminShellHeader />
            {signOutError === null ? null : (
              <Alert
                className="mx-3 mt-4 @[40rem]/admin-shell:mx-5 @[56rem]/admin-shell:mx-6"
                role="alert"
                variant="destructive"
              >
                <AlertDescription>{signOutError}</AlertDescription>
              </Alert>
            )}
            <div
              data-slot="admin-shell-main"
              className={cn(
                "@container/admin-main animate-drift-in flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-3 py-5",
                "@[40rem]/admin-shell:gap-8 @[40rem]/admin-shell:px-5 @[40rem]/admin-shell:py-7",
                "@[56rem]/admin-shell:px-6 @[56rem]/admin-shell:py-8"
              )}
            >
              {children}
            </div>
          </SidebarInset>
        </AdminShellChromeProvider>
      </SidebarProvider>
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
