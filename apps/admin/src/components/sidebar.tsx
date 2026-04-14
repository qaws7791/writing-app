"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@workspace/ui"
import { buttonVariants } from "@workspace/ui/components/button"

const navItems = [
  { href: "/journeys", label: "여정 관리" },
  { href: "/prompts", label: "글감 관리" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-separator bg-surface">
      <div className="flex h-14 items-center border-b border-separator px-5">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          글필 어드민
        </span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "justify-start",
                isActive && "bg-default text-foreground"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
