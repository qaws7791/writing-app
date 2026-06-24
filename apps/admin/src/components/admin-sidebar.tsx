import {
  BarChart3,
  BookOpen,
  Bot,
  FolderOpen,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react"
import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

const navigationItems = [
  {
    href: "/",
    icon: LayoutDashboard,
    label: "대시보드",
  },
  {
    href: "/courses",
    icon: BookOpen,
    label: "콘텐츠 관리",
  },
  {
    href: "/users",
    icon: Users,
    label: "사용자 관리",
  },
  {
    href: "/analytics",
    icon: BarChart3,
    label: "분석",
  },
  {
    href: "/resources",
    icon: FolderOpen,
    label: "자료실",
  },
  {
    href: "/chat",
    icon: Bot,
    label: "AI 채팅",
  },
  {
    href: "/settings",
    icon: Settings,
    label: "운영 설정",
  },
] as const

export function AdminSidebar({ activePath }: { readonly activePath: string }) {
  return (
    <aside className="admin-sidebar">
      <Link className="admin-sidebar__brand" href="/">
        <span className="admin-sidebar__mark">글</span>
        <span>
          <strong>글결 관리자</strong>
          <small>글결 운영 콘솔</small>
        </span>
      </Link>
      <nav aria-label="어드민 주요 메뉴" className="admin-sidebar__nav">
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/"
              ? activePath === item.href
              : activePath.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn("admin-sidebar__link", isActive && "is-active")}
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
