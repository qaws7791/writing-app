"use client"

import type { ReactNode } from "react"
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

function NavItem({
  href,
  label,
  active,
  icon,
}: {
  href: string
  label: string
  active: boolean
  icon: ReactNode
}) {
  return (
    <Link
      href={href}
      className={`text-label-small flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
        active ? "text-on-surface" : "text-on-surface-lowest"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="border-outline-variant safe-area-pb fixed right-0 bottom-0 left-0 z-50 flex border-t bg-surface">
      {NAV_ITEMS.map(({ icon, label, href }) => {
        const isActive = pathname === href
        return (
          <NavItem
            key={href}
            href={href}
            label={label}
            active={isActive}
            icon={
              <HugeiconsIcon
                icon={icon}
                size={24}
                color="currentColor"
                strokeWidth={isActive ? 2 : 1.5}
              />
            }
          />
        )
      })}
    </nav>
  )
}
