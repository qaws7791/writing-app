"use client"

import Link from "next/link"
import { ExternalLink, LogOut } from "lucide-react"
import {
  adminNavigationItems,
  isAdminNavigationActive,
} from "@/app/(admin)/_views/admin-navigation"
import { cn } from "@workspace/ui/lib/utils"

export function AdminSidebar({
  activePath,
  isSigningOut,
  learnerWebOrigin,
  onSignOut,
}: {
  readonly activePath: string
  readonly isSigningOut: boolean
  readonly learnerWebOrigin: string
  readonly onSignOut: () => void
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-surface p-5 md:flex">
      <Link
        className="mb-6 px-3 py-2 text-[1.375rem] font-bold text-foreground"
        href="/"
      >
        글결 <span className="text-muted-foreground">어드민</span>
      </Link>
      <nav aria-label="어드민 주요 메뉴" className="flex flex-1 flex-col gap-1">
        {adminNavigationItems.map((item) => {
          const isActive = isAdminNavigationActive(
            activePath,
            item.href,
            item.end
          )
          const Icon = item.icon

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-auto w-full items-center justify-start gap-3 rounded-3xl px-4 py-3 text-body-md font-bold transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary"
                  : "text-foreground hover:bg-background"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" size={20} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="flex flex-col gap-1 pt-4">
        <a
          className="flex h-auto w-full items-center justify-start gap-3 rounded-3xl px-4 py-3 text-[0.9375rem] text-muted-foreground hover:bg-background"
          href={learnerWebOrigin}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink aria-hidden="true" size={18} />
          앱으로 이동
        </a>
        <button
          className="flex h-auto w-full items-center justify-start gap-3 rounded-3xl bg-transparent px-4 py-3 text-left text-[0.9375rem] text-destructive hover:bg-background disabled:opacity-60"
          disabled={isSigningOut}
          onClick={onSignOut}
          type="button"
        >
          <LogOut aria-hidden="true" size={18} />
          어드민 로그아웃
        </button>
      </div>
    </aside>
  )
}
