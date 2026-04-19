"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HomeIcon, BookOpenIcon, PenToolIcon } from "lucide-react"

import { cn } from "@workspace/ui/utils"

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: HomeIcon },
  { href: "/journeys", label: "여정 관리", icon: BookOpenIcon },
  { href: "/prompts", label: "글감 관리", icon: PenToolIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-background">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
          글
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          글필 어드민
        </span>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {
                <item.icon
                  size={20}
                  className="shrink-0"
                  strokeWidth={isActive ? 2 : 1.5}
                />
              }
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
