"use client"

import Link from "next/link"
import { ExternalLink, LogOut } from "lucide-react"
import {
  adminNavigationItems,
  isAdminNavigationActive,
} from "@/lib/navigation/admin-navigation"
import { readLearnerWebOrigin } from "@/runtime-config"
import { buttonVariants } from "@workspace/ui/components/ui/button"

const learnerWebOrigin = readLearnerWebOrigin()

export function AdminSidebar({
  activePath,
  isSigningOut,
  onSignOut,
}: {
  readonly activePath: string
  readonly isSigningOut: boolean
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
              className={buttonVariants({
                className: isActive
                  ? "h-auto w-full justify-start gap-3 rounded-3xl bg-primary px-4 py-3 text-body-md text-primary-foreground hover:bg-primary"
                  : "h-auto w-full justify-start gap-3 rounded-3xl px-4 py-3 text-body-md text-foreground hover:bg-background",
                variant: isActive ? "secondary" : "ghost",
              })}
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
          className={buttonVariants({
            className:
              "h-auto w-full justify-start gap-3 rounded-3xl px-4 py-3 text-[0.9375rem] text-muted-foreground hover:bg-background",
            variant: "ghost",
          })}
          href={learnerWebOrigin}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink aria-hidden="true" size={18} />
          앱으로 이동
        </a>
        <button
          className={buttonVariants({
            className:
              "h-auto w-full justify-start gap-3 rounded-3xl bg-transparent px-4 py-3 text-left text-[0.9375rem] text-destructive hover:bg-background disabled:opacity-60",
            variant: "destructive",
          })}
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
