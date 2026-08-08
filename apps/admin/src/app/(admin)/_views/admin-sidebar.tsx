import Link from "next/link"

import {
  isAdminNavigationActive,
  type AdminNavigationItem,
} from "@/app/(admin)/_views/admin-navigation"
import {
  ExternalLinkIcon,
  LogOutIcon,
} from "@workspace/ui/components/icons/navigation-icons"
import { Button, buttonVariants } from "@workspace/ui/components/ui/button"
import { cn } from "@workspace/ui/lib/utils"

export type AdminSidebarProps = {
  readonly activePath: string
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
  isSigningOut,
  learnerWebOrigin,
  navigationItems,
  onNavigate,
  onSignOut,
}: AdminSidebarProps & { readonly onNavigate?: () => void }) {
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
              {...(onNavigate === undefined ? {} : { onClick: onNavigate })}
            >
              <Icon aria-hidden="true" size={20} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          )

          return link
        })}
      </nav>
      <div className="flex flex-col gap-2 pt-4">
        <a
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
          href={learnerWebOrigin}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLinkIcon aria-hidden="true" size={18} />
          앱으로 이동
        </a>
        <Button
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={isSigningOut}
          onClick={onSignOut}
          type="button"
          variant="ghost"
        >
          <LogOutIcon aria-hidden="true" size={18} />
          어드민 로그아웃
        </Button>
      </div>
    </div>
  )
}
