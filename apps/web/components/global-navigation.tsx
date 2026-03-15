"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CompassIcon,
  Home01Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

const links = [
  {
    href: "/",
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
        className="hidden flex-col items-center bg-[#FAFAFA] px-4 md:flex"
        aria-label="메인 네비게이션"
      >
        <div className="my-auto flex flex-col gap-4">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex h-12 w-12 items-center justify-center rounded-[16px] transition-colors ${
                  isActive
                    ? "bg-neutral-100 text-[#111111]"
                    : "text-[#4A5568] hover:bg-neutral-100 hover:text-[#111111]"
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
      </nav>

      {/* 모바일: 바텀 네비게이션 (md 미만) */}
      <nav
        className="fixed right-0 bottom-0 left-0 z-50 md:hidden"
        aria-label="메인 네비게이션"
      >
        {/* 글래스모피즘 배경 + 라운드 상단 */}
        <div className="rounded-t-2xl border-t bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.03)] backdrop-blur-md">
          <div className="flex items-center justify-around py-2">
            {links.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors ${
                    isActive
                      ? "text-[#111111]"
                      : "text-[#9CA3AF] hover:text-[#6B7280]"
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
                    className={`text-[10px] leading-tight ${
                      isActive ? "font-semibold" : "font-medium"
                    }`}
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
