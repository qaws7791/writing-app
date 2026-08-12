"use client"

import Link, { useLinkStatus } from "next/link"

import {
  AdminProfileMenu,
  type AdminProfile,
} from "@/app/(admin)/_views/admin-profile-menu"
import {
  adminNavigationGroups,
  isAdminNavigationActive,
} from "@/app/(admin)/_views/admin-navigation"
import { XIcon } from "@workspace/ui/components/icons/control-icons"
import { Button } from "@workspace/ui/components/primitives/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/primitives/sidebar"

export type AdminSidebarProps = {
  readonly activePath: string
  readonly adminProfile: AdminProfile
  readonly isSigningOut: boolean
  readonly learnerWebOrigin: string
  readonly onSignOut: () => void
}

export function AdminSidebar({
  activePath,
  adminProfile,
  isSigningOut,
  learnerWebOrigin,
  onSignOut,
}: AdminSidebarProps) {
  return (
    <Sidebar className="absolute! h-full!">
      <SidebarHeader>
        <AdminSidebarBrand />
      </SidebarHeader>
      <SidebarContent>
        <AdminNavGroups activePath={activePath} />
      </SidebarContent>
      <SidebarFooter>
        <AdminProfileMenu
          adminProfile={adminProfile}
          isSigningOut={isSigningOut}
          learnerWebOrigin={learnerWebOrigin}
          onSignOut={onSignOut}
        />
      </SidebarFooter>
    </Sidebar>
  )
}

function AdminSidebarBrand() {
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <div className="flex items-center gap-2 px-0.5">
      <Link
        className="min-w-0 flex-1 py-1 font-heading text-xl font-semibold tracking-[-0.025em] text-sidebar-foreground"
        href="/"
        prefetch={false}
        onClick={() => {
          if (isMobile) setOpenMobile(false)
        }}
      >
        글결 <span className="text-muted-foreground">어드민</span>
      </Link>
      {isMobile ? (
        <Button
          aria-label="사이드바 닫기"
          className="shrink-0 text-muted-foreground hover:text-sidebar-accent-foreground"
          size="icon-sm"
          type="button"
          variant="ghost"
          onClick={() => setOpenMobile(false)}
        >
          <XIcon aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  )
}

function AdminNavGroups({ activePath }: { readonly activePath: string }) {
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <>
      {adminNavigationGroups.map((group) => (
        <SidebarGroup key={group.id}>
          {group.label === null ? null : (
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = isAdminNavigationActive(
                  activePath,
                  item.href,
                  item.end
                )
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={
                        <Link
                          aria-current={isActive ? "page" : undefined}
                          aria-label={item.label}
                          href={item.href}
                          prefetch={false}
                          onClick={() => {
                            if (isMobile) setOpenMobile(false)
                          }}
                        />
                      }
                    >
                      <Icon aria-hidden="true" size={16} strokeWidth={2} />
                      <span>{item.label}</span>
                      <AdminNavigationPendingStatus />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}

function AdminNavigationPendingStatus() {
  const { pending } = useLinkStatus()

  return (
    <span
      aria-hidden="true"
      data-slot="sidebar-menu-trailing"
      className={cn(
        "w-10 shrink-0 text-right text-xs text-sidebar-foreground/60 opacity-0 transition-opacity duration-(--motion-duration-fast) ease-quiet",
        pending ? "delay-150 opacity-100" : "delay-0"
      )}
    >
      이동 중
    </span>
  )
}
