"use client"

import { useState } from "react"
import Link from "next/link"

import {
  isAdminNavigationActive,
  type AdminNavigationItem,
} from "@/app/(admin)/_views/admin-navigation"
import {
  ExternalLinkIcon,
  LogOutIcon,
  MenuIcon,
} from "@workspace/ui/components/icons"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/ui/dialog"
import { cn } from "@workspace/ui/lib/utils"

type AdminSidebarProps = {
  readonly activePath: string
  readonly isSigningOut: boolean
  readonly learnerWebOrigin: string
  readonly navigationItems: readonly AdminNavigationItem[]
  readonly onSignOut: () => void
}

export function AdminSidebar(props: AdminSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-bg-surface p-5 md:flex">
      <AdminSidebarContent {...props} />
    </aside>
  )
}

export function AdminMobileSidebar(props: AdminSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button aria-label="메뉴 열기" size="icon" variant="ghost">
            <MenuIcon aria-hidden="true" />
          </Button>
        }
      />
      <DialogContent className="left-0 top-0 h-dvh w-[min(20rem,calc(100vw-2rem))] max-w-none translate-x-0 translate-y-0 content-start rounded-none rounded-r-4xl bg-bg-elevated p-5 sm:max-w-none">
        <DialogTitle className="sr-only">어드민 메뉴</DialogTitle>
        <AdminSidebarContent {...props} onNavigate={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

function AdminSidebarContent({
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
        className="mb-6 px-3 py-2 text-[1.375rem] font-bold text-fg-default"
        href="/"
        prefetch={false}
      >
        글결 <span className="text-fg-muted">어드민</span>
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
                "flex h-auto w-full items-center justify-start gap-3 rounded-3xl px-4 py-3 text-body-md font-bold transition-colors",
                isActive
                  ? "bg-action-primary-bg text-action-primary-fg"
                  : "text-fg-default hover:bg-bg-canvas"
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
          className="flex h-auto w-full items-center justify-start gap-3 rounded-3xl px-4 py-3 text-[0.9375rem] text-fg-muted hover:bg-bg-canvas"
          href={learnerWebOrigin}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLinkIcon aria-hidden="true" size={18} />
          앱으로 이동
        </a>
        <button
          className="flex h-auto w-full items-center justify-start gap-3 rounded-3xl bg-transparent px-4 py-3 text-left text-[0.9375rem] text-danger-fg hover:bg-danger disabled:opacity-60"
          disabled={isSigningOut}
          onClick={onSignOut}
          type="button"
        >
          <LogOutIcon aria-hidden="true" size={18} />
          어드민 로그아웃
        </button>
      </div>
    </div>
  )
}
