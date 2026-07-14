"use client"

import Link from "next/link"

import { globalNavAccountItems } from "@/components/layout/global-nav-routes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

export function GlobalNavAccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="계정 메뉴"
        className="flex size-9 items-center justify-center rounded-full bg-accent font-black ring-2 ring-surface btn-squish hover:ring-surface-hover"
        type="button"
      >
        ✍️
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          "w-48 min-w-48 max-w-48",
          "rounded-4xl border-2 border-surface bg-cream p-4",
          "shadow-none ring-0"
        )}
        sideOffset={12}
      >
        {globalNavAccountItems.map((item) => (
          <DropdownMenuItem
            key={item.label}
            className={cn(
              "w-full justify-start rounded-3xl px-4 py-3 text-body-sm font-bold no-underline",
              "hover:bg-surface focus:bg-surface data-highlighted:bg-surface",
              item.tone === "danger"
                ? "text-coral-dark focus:text-coral-dark data-highlighted:text-coral-dark"
                : "text-foreground focus:text-foreground data-highlighted:text-foreground"
            )}
            render={<Link href={item.href} />}
            variant="default"
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
