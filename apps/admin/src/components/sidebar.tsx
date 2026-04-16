"use client"

import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home01Icon,
  BookOpen01Icon,
  QuillWrite01Icon,
} from "@hugeicons/core-free-icons"

import { Sidebar as UiSidebar } from "@workspace/ui/components/sidebar"

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: Home01Icon },
  { href: "/journeys", label: "여정 관리", icon: BookOpen01Icon },
  { href: "/prompts", label: "글감 관리", icon: QuillWrite01Icon },
]

export function Sidebar() {
  const pathname = usePathname()

  const activeItem = navItems.find((item) =>
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href)
  )

  return (
    <UiSidebar.Root className="border-r border-separator bg-surface">
      <UiSidebar.Header>
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
            글
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            글필 어드민
          </span>
        </div>
      </UiSidebar.Header>

      <UiSidebar.Body
        selectionMode="single"
        selectedKeys={activeItem ? [activeItem.href] : []}
      >
        {navItems.map((item) => {
          const isActive = activeItem?.href === item.href

          return (
            <UiSidebar.Item
              key={item.href}
              id={item.href}
              href={item.href}
              textValue={item.label}
            >
              <div className="flex w-full items-center gap-2.5">
                <HugeiconsIcon
                  icon={item.icon}
                  size={20}
                  color="currentColor"
                  className="shrink-0"
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </UiSidebar.Item>
          )
        })}
      </UiSidebar.Body>
    </UiSidebar.Root>
  )
}
