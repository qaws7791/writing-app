"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home01Icon,
  BookOpen01Icon,
  QuillWrite01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons"

const NAV_ITEMS = [
  { icon: Home01Icon, label: "홈", href: "/home" },
  { icon: BookOpen01Icon, label: "여정", href: "/journeys" },
  { icon: QuillWrite01Icon, label: "글쓰기", href: "/writings" },
  { icon: User02Icon, label: "프로필", href: "/profile" },
] as const

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-around rounded-tl-[2rem] rounded-tr-[2rem] border-t border-outline/20 bg-surface/95 px-4 py-4.25 shadow-[0px_-12px_40px_0px_rgba(47,52,48,0.04)] backdrop-blur-xl">
      {NAV_ITEMS.map(({ icon, label, href }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? "text-primary" : "text-on-surface-lowest"
            }`}
          >
            <HugeiconsIcon
              icon={icon}
              size={24}
              color="currentColor"
              strokeWidth={isActive ? 2 : 1.5}
            />
            <span className="font-semibold tracking-wide text-[11px] uppercase">
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
