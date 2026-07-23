import type { ComponentType } from "react"
import type { AdminRole } from "@workspace/contracts/identity/admin-session"

import {
  BarChartIcon,
  BookOpenIcon,
  BotIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UsersIcon,
} from "@workspace/ui/components/icons"

export type AdminNavigationItem = {
  readonly end?: boolean
  readonly href: string
  readonly icon: ComponentType<{
    readonly "aria-hidden"?: boolean | "true" | "false"
    readonly size?: number
    readonly strokeWidth?: number
  }>
  readonly label: string
  readonly ownerOnly?: boolean
}

export const adminNavigationItems = [
  {
    end: true,
    href: "/",
    icon: LayoutDashboardIcon,
    label: "대시보드",
  },
  {
    end: false,
    href: "/courses",
    icon: BookOpenIcon,
    label: "콘텐츠 관리",
  },
  {
    end: false,
    href: "/resources",
    icon: FolderOpenIcon,
    label: "자료실",
  },
  {
    end: false,
    href: "/chat",
    icon: BotIcon,
    label: "AI 에이전트",
  },
  {
    end: false,
    href: "/users",
    icon: UsersIcon,
    label: "사용자 관리",
  },
  {
    end: false,
    href: "/analytics",
    icon: BarChartIcon,
    label: "분석",
  },
  {
    end: false,
    href: "/maintenance",
    icon: SettingsIcon,
    label: "콘텐츠 유지보수",
    ownerOnly: true,
  },
] as const satisfies readonly AdminNavigationItem[]

export function readAdminNavigationItems(
  role: AdminRole
): readonly AdminNavigationItem[] {
  return adminNavigationItems.filter(
    (item) => !("ownerOnly" in item) || !item.ownerOnly || role === "owner"
  )
}

export function isAdminNavigationActive(
  activePath: string,
  href: string,
  end = false
): boolean {
  if (href === "/") {
    return activePath === "/"
  }

  if (end) {
    return activePath === href
  }

  return activePath.startsWith(href)
}
