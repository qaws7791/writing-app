"use client"

import Link from "next/link"
import { ExternalLink, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { requestAdminSignOut } from "@/lib/auth/admin-auth-client"
import {
  adminNavigationItems,
  isAdminNavigationActive,
} from "@/lib/navigation/admin-navigation"
import { readLearnerWebOrigin } from "@/runtime-config"
import { cn } from "@workspace/ui/lib/utils"

const learnerWebOrigin = readLearnerWebOrigin()

export function AdminSidebar({ activePath }: { readonly activePath: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

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
                "btn-squish flex items-center gap-3 rounded-3xl px-4 py-3 text-body-md font-bold transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
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
          className="btn-squish flex items-center gap-3 rounded-3xl px-4 py-3 text-[0.9375rem] font-bold text-muted-foreground transition-colors hover:bg-background"
          href={learnerWebOrigin}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink aria-hidden="true" size={18} />
          앱으로 이동
        </a>
        <button
          className="btn-squish flex items-center gap-3 rounded-3xl px-4 py-3 text-left text-[0.9375rem] font-bold text-destructive transition-colors hover:bg-background disabled:opacity-60"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await requestAdminSignOut()
              router.replace("/login")
            })
          }}
          type="button"
        >
          <LogOut aria-hidden="true" size={18} />
          어드민 로그아웃
        </button>
      </div>
    </aside>
  )
}
