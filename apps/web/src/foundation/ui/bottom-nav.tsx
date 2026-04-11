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
import { NavigationBar, NavItem } from "@workspace/ui/components/navigation-bar"

const NAV_ITEMS = [
  { icon: Home01Icon, label: "홈", href: "/home" },
  { icon: BookOpen01Icon, label: "여정", href: "/journeys" },
  { icon: QuillWrite01Icon, label: "글쓰기", href: "/writings" },
  { icon: User02Icon, label: "프로필", href: "/profile" },
] as const

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <NavigationBar>
      {NAV_ITEMS.map(({ icon, label, href }) => {
        const isActive = pathname === href
        return (
          <NavItem
            key={href}
            as={Link}
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
    </NavigationBar>
  )
}
