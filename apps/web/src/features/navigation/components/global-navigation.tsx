"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CompassIcon,
  Home01Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { AuthSignOutButton } from "@/features/auth"

const links = [
  {
    href: "/home",
    icon: Home01Icon,
    label: "홈",
  },
  {
    href: "/prompts",
    icon: CompassIcon,
    label: "글감 찾기",
  },
  {
    href: "/write",
    icon: PencilEdit02Icon,
    label: "내 글",
  },
]

export default function GlobalNavigation() {
  const pathname = usePathname()

  return (
    <>
      {/* 데스크톱: 사이드 네비게이션 (md 이상) */}
      <nav
        className="hidden flex-col items-center bg-background px-4 md:flex"
        aria-label="메인 네비게이션"
      >
        <div className="my-auto flex flex-col gap-4">
          {links.map((link) => {
            const isActive =
              link.href === "/home"
                ? pathname === "/home"
                : pathname.startsWith(link.href)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex size-12 items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={link.label}
              >
                <HugeiconsIcon
                  icon={link.icon}
                  size={24}
                  color="currentColor"
                  strokeWidth={isActive ? 2 : 1.5}
                />
              </Link>
            )
          })}
        </div>
        <div className="mb-6">
          <AuthSignOutButton />
        </div>
      </nav>

      {/* 모바일: 바텀 네비게이션 (md 미만) */}
      <nav
        className="fixed right-0 bottom-0 left-0 z-50 md:hidden"
        aria-label="메인 네비게이션"
      >
        {/* 글래스모피즘 배경 + 라운드 상단 */}
        <div className="rounded-t-2xl border-t border-border bg-card/95 px-2 safe-area-pb shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-around py-2">
            {links.map((link) => {
              const isActive =
                link.href === "/home"
                  ? pathname === "/home"
                  : pathname.startsWith(link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground/80"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <HugeiconsIcon
                    icon={link.icon}
                    size={22}
                    color="currentColor"
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <span
                    className={`text-[10px] leading-none ${isActive ? "font-semibold" : "font-medium"}`}
                  >
                    {link.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}
