import Link, { useLinkStatus } from "next/link"

import {
  AdminProfileMenu,
  type AdminProfile,
} from "@/app/(admin)/_views/admin-profile-menu"
import {
  isAdminNavigationActive,
  type AdminNavigationItem,
} from "@/app/(admin)/_views/admin-navigation"
import { cn } from "@workspace/ui/lib/utils"

export type AdminSidebarProps = {
  readonly activePath: string
  readonly adminProfile: AdminProfile
  readonly isSigningOut: boolean
  readonly learnerWebOrigin: string
  readonly navigationItems: readonly AdminNavigationItem[]
  readonly onSignOut: () => void
}

export function AdminSidebar(props: AdminSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-e border-sidebar-border/80 bg-sidebar p-4 text-sidebar-foreground md:flex">
      <AdminSidebarContent {...props} />
    </aside>
  )
}

export function AdminSidebarContent({
  activePath,
  adminProfile,
  isSigningOut,
  learnerWebOrigin,
  navigationItems,
  onSignOut,
}: AdminSidebarProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Link
        className="mb-6 px-3 py-2 font-heading text-xl font-semibold tracking-[-0.025em] text-sidebar-foreground"
        href="/"
        prefetch={false}
      >
        글결 <span className="text-muted-foreground">어드민</span>
      </Link>
      <nav aria-label="어드민 주요 메뉴" className="flex flex-1 flex-col gap-1">
        {navigationItems.map((item) => {
          const isActive = isAdminNavigationActive(
            activePath,
            item.href,
            item.end
          )
          const Icon = item.icon

          const link = (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-auto w-full items-center justify-start gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/25",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/65 hover:text-sidebar-accent-foreground"
              )}
              href={item.href}
              key={item.href}
              prefetch={false}
            >
              <Icon aria-hidden="true" size={20} strokeWidth={2} />
              <span>{item.label}</span>
              <AdminNavigationPendingStatus />
            </Link>
          )

          return link
        })}
      </nav>
      <div className="border-t border-sidebar-border/70 pt-3">
        <AdminProfileMenu
          adminProfile={adminProfile}
          isSigningOut={isSigningOut}
          learnerWebOrigin={learnerWebOrigin}
          onSignOut={onSignOut}
        />
      </div>
    </div>
  )
}

function AdminNavigationPendingStatus() {
  const { pending } = useLinkStatus()

  return (
    <span
      aria-hidden="true"
      className={cn(
        "ml-auto w-10 shrink-0 text-right text-xs text-sidebar-foreground/60 opacity-0 transition-opacity duration-(--motion-duration-fast) ease-quiet",
        pending ? "delay-150 opacity-100" : "delay-0"
      )}
    >
      이동 중
    </span>
  )
}
