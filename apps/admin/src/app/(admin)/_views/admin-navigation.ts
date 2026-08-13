import type { ComponentType } from "react"

import {
  BarChartIcon,
  BookOpenIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@workspace/ui/components/icons/navigation-icons"

type AdminNavigationItem = {
  readonly end?: boolean
  readonly href: string
  readonly icon: ComponentType<{
    readonly "aria-hidden"?: boolean | "true" | "false"
    readonly size?: number
    readonly strokeWidth?: number
  }>
  readonly label: string
}

export type AdminNavigationGroup = {
  readonly id: string
  readonly label: string | null
  readonly items: readonly AdminNavigationItem[]
}

export const adminNavigationGroups = [
  {
    id: "overview",
    label: null,
    items: [
      {
        end: true,
        href: "/",
        icon: LayoutDashboardIcon,
        label: "대시보드",
      },
    ],
  },
  {
    id: "content",
    label: "콘텐츠",
    items: [
      {
        end: false,
        href: "/courses",
        icon: BookOpenIcon,
        label: "콘텐츠 관리",
      },
      {
        end: false,
        href: "/writing-tasks",
        icon: FileTextIcon,
        label: "쓰기 과제",
      },
    ],
  },
  {
    id: "learners",
    label: "학습자",
    items: [
      {
        end: false,
        href: "/users",
        icon: UsersIcon,
        label: "사용자 관리",
      },
    ],
  },
  {
    id: "insights",
    label: "인사이트",
    items: [
      {
        end: false,
        href: "/analytics",
        icon: BarChartIcon,
        label: "분석",
      },
    ],
  },
  {
    id: "system",
    label: "시스템",
    items: [
      {
        end: false,
        href: "/audit",
        icon: ShieldCheckIcon,
        label: "감사 이력",
      },
    ],
  },
] as const satisfies readonly AdminNavigationGroup[]

export type AdminShellBreadcrumbItem = {
  readonly href?: string
  readonly label: string
}

export type AdminShellChromeValue = {
  readonly breadcrumb?: readonly AdminShellBreadcrumbItem[]
  readonly title: string
}

const COURSE_DETAIL_PATH = /^\/courses\/[^/]+$/
const WRITING_TASK_DETAIL_PATH = /^\/writing-tasks\/[^/]+$/
const USER_DETAIL_PATH = /^\/users\/[^/]+$/

export function resolveAdminShellChrome(
  pathname: string
): AdminShellChromeValue {
  if (pathname === "/") {
    return { title: "대시보드" }
  }

  if (pathname === "/courses") {
    return { title: "콘텐츠 관리" }
  }

  if (COURSE_DETAIL_PATH.test(pathname)) {
    return {
      breadcrumb: [{ href: "/courses", label: "콘텐츠 관리" }],
      title: "코스 편집",
    }
  }

  if (pathname === "/writing-tasks") {
    return { title: "쓰기 과제" }
  }

  if (WRITING_TASK_DETAIL_PATH.test(pathname)) {
    return {
      breadcrumb: [{ href: "/writing-tasks", label: "쓰기 과제" }],
      title: "과제 편집",
    }
  }

  if (pathname === "/users") {
    return { title: "사용자 관리" }
  }

  if (USER_DETAIL_PATH.test(pathname)) {
    return {
      breadcrumb: [{ href: "/users", label: "사용자 관리" }],
      title: "사용자",
    }
  }

  if (pathname === "/analytics") {
    return { title: "분석" }
  }

  if (pathname === "/audit") {
    return { title: "감사 이력" }
  }

  return { title: "글결 어드민" }
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
