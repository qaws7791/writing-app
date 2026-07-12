import type { ComponentType } from "react"

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
    href: "/settings",
    icon: SettingsIcon,
    label: "운영 설정",
  },
  {
    end: true,
    href: "/mfa",
    icon: SettingsIcon,
    label: "보안",
  },
] as const satisfies readonly AdminNavigationItem[]

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
