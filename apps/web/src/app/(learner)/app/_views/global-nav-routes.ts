const globalNavRoutePaths = {
  home: "/app",
  learn: "/app/courses",
  profile: "/app/profile",
  writing: "/app/writing",
} as const

export type GlobalNavRouteKey = keyof typeof globalNavRoutePaths

export const globalNavBrandRoute = {
  href: globalNavRoutePaths.home,
  label: "글결.",
} as const

export const globalNavPrimaryItems = [
  {
    href: globalNavRoutePaths.home,
    key: "home",
    label: "홈",
  },
  {
    href: globalNavRoutePaths.learn,
    key: "learn",
    label: "배우기",
  },
  {
    href: globalNavRoutePaths.writing,
    key: "writing",
    label: "쓰기",
  },
] as const

export const globalNavMobileItems = [
  {
    href: globalNavRoutePaths.home,
    key: "home",
    label: "홈",
  },
  {
    href: globalNavRoutePaths.learn,
    key: "learn",
    label: "배우기",
  },
  {
    href: globalNavRoutePaths.writing,
    key: "writing",
    label: "쓰기",
  },
  {
    href: globalNavRoutePaths.profile,
    key: "profile",
    label: "프로필",
  },
] as const

export const globalNavAccountItems = [
  {
    href: globalNavRoutePaths.profile,
    label: "프로필",
    tone: "default",
  },
  {
    href: "/login",
    label: "로그아웃",
    tone: "danger",
  },
] as const

export function isGlobalNavRouteActive(
  pathname: string,
  key: GlobalNavRouteKey
): boolean {
  if (key === "learn") {
    return (
      pathname === globalNavRoutePaths.learn ||
      pathname.startsWith(`${globalNavRoutePaths.learn}/`)
    )
  }

  if (key === "writing") {
    return (
      pathname === globalNavRoutePaths.writing ||
      pathname.startsWith(`${globalNavRoutePaths.writing}/`)
    )
  }

  return pathname === globalNavRoutePaths[key]
}
