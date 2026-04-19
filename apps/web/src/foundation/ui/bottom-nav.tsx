"use client"

import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BookOpen, PenLine, User } from "lucide-react"

const NAV_ITEMS: { icon: LucideIcon; label: string; href: string }[] = [
  { icon: Home, label: "홈", href: "/home" },
  { icon: BookOpen, label: "여정", href: "/journeys" },
  { icon: PenLine, label: "글쓰기", href: "/writings" },
  { icon: User, label: "프로필", href: "/profile" },
]

function NavItem({
  href,
  label,
  active,
  icon: Icon,
}: {
  href: string
  label: string
  active: boolean
  icon: LucideIcon
}) {
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs leading-4 font-medium transition-colors ${
        active ? "text-foreground" : "text-muted-foreground/80"
      }`}
    >
      <Icon size={24} strokeWidth={active ? 2 : 1.5} className="text-current" />
      <span>{label}</span>
    </Link>
  )
}

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="safe-area-pb fixed right-0 bottom-0 left-0 z-50 flex border-t border-border bg-background">
      {NAV_ITEMS.map(({ icon, label, href }) => (
        <NavItem
          key={href}
          href={href}
          label={label}
          active={pathname === href}
          icon={icon}
        />
      ))}
    </nav>
  )
}
