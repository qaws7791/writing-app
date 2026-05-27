"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@workspace/ui/components/ui/button"
import {
  BookOpenIcon,
  HomeIcon,
  LogoIcon,
  SearchIcon,
  UserIcon,
  type LucideIcon,
} from "@workspace/ui/components/icons"
import { cn } from "@workspace/ui/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  id: string
}

const primaryNavItems: NavItem[] = [
  {
    href: "/app",
    label: "홈",
    icon: HomeIcon,
    id: "nav-home",
  },
  {
    href: "/app/courses",
    label: "배우기",
    icon: BookOpenIcon,
    id: "nav-courses",
  },
]

const profileNavItem: NavItem = {
  href: "/app/profile",
  label: "프로필",
  icon: UserIcon,
  id: "nav-profile",
}

const mobileNavItems: NavItem[] = [...primaryNavItems, profileNavItem]

function isActivePath(pathname: string, href: string) {
  if (href === "/" || href === "/app") {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function GlobalNav() {
  const pathname = usePathname()

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 hidden h-14 border-b border-border/70 bg-background/95 backdrop-blur-xl md:block">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-8 px-6">
          <div className="flex flex-1 items-center gap-8">
            <Link
              href="/app"
              className="flex shrink-0 items-center text-primary transition-opacity hover:opacity-80"
              aria-label="홈으로 이동"
              id="header-logo"
            >
              <LogoIcon className="size-7" aria-hidden="true" />
            </Link>

            <nav className="flex items-center gap-1" aria-label="주요 메뉴">
              {primaryNavItems.map((item) => {
                const Icon = item.icon
                const active = isActivePath(pathname, item.href)

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    id={item.id}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      active && "bg-muted font-semibold text-foreground"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      className="size-5"
                      strokeWidth={active ? 2.5 : 2}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="검색"
              id="header-search-btn"
            >
              <SearchIcon aria-hidden="true" />
            </Button>

            <Link
              href="/app/profile"
              className={cn(
                "flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                isActivePath(pathname, "/app/profile") && "text-foreground"
              )}
              aria-label="프로필"
              aria-current={
                isActivePath(pathname, "/app/profile") ? "page" : undefined
              }
              id="header-profile-btn"
            >
              <UserIcon className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(4rem+env(safe-area-inset-bottom))] border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="하단 메뉴"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const active = isActivePath(pathname, item.href)

          return (
            <Link
              key={item.id}
              href={item.href}
              id={`bottom-${item.id}`}
              className={cn(
                "group relative flex flex-1 flex-col items-center justify-center gap-1 p-2 text-muted-foreground transition-colors hover:text-foreground",
                active && "text-foreground"
              )}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative flex size-7 items-center justify-center transition-transform group-active:scale-95">
                <Icon
                  className="size-5"
                  strokeWidth={active ? 2.5 : 2}
                  aria-hidden="true"
                />
                {active ? (
                  <span className="absolute top-0 size-1 rounded-full bg-primary" />
                ) : null}
              </span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
