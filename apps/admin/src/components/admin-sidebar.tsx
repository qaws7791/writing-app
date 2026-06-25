import Link from "next/link"

import {
  BarChartIcon,
  BookOpenIcon,
  BotIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UsersIcon,
} from "@workspace/ui/components/icons"
import { cn } from "@workspace/ui/lib/utils"

const navigationItems = [
  {
    href: "/",
    icon: LayoutDashboardIcon,
    label: "대시보드",
  },
  {
    href: "/courses",
    icon: BookOpenIcon,
    label: "콘텐츠 관리",
  },
  {
    href: "/users",
    icon: UsersIcon,
    label: "사용자 관리",
  },
  {
    href: "/analytics",
    icon: BarChartIcon,
    label: "분석",
  },
  {
    href: "/resources",
    icon: FolderOpenIcon,
    label: "자료실",
  },
  {
    href: "/chat",
    icon: BotIcon,
    label: "AI 채팅",
  },
  {
    href: "/settings",
    icon: SettingsIcon,
    label: "운영 설정",
  },
] as const

export function AdminSidebar({ activePath }: { readonly activePath: string }) {
  return (
    <aside className="sticky top-0 flex h-screen flex-col gap-6 bg-bg-surface p-5 max-[860px]:static max-[860px]:h-auto max-[860px]:border-b max-[860px]:border-border-subtle">
      <Link className="flex items-center gap-3 px-3 pb-4 pt-2" href="/">
        <span className="grid size-[42px] place-items-center rounded-[18px] bg-action-primary-bg text-action-primary-fg font-black">
          글
        </span>
        <span className="grid gap-0.5">
          <strong className="text-[1.375rem] font-black leading-tight">
            글결 관리자
          </strong>
          <small className="text-label-sm font-bold text-fg-muted">
            글결 운영 콘솔
          </small>
        </span>
      </Link>
      <nav
        aria-label="어드민 주요 메뉴"
        className="grid gap-1.5 max-[860px]:flex max-[860px]:overflow-x-auto max-[860px]:pb-0.5"
      >
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/"
              ? activePath === item.href
              : activePath.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "btn-squish flex items-center gap-3 rounded-pill px-4 py-3 text-body-md font-black transition-colors max-[860px]:shrink-0",
                isActive
                  ? "bg-action-primary-bg text-action-primary-fg"
                  : "text-fg-default hover:bg-bg-canvas"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
