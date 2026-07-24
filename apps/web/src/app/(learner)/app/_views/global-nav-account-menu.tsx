"use client"

import Link from "next/link"

import { globalNavAccountItems } from "@/app/(learner)/app/_views/global-nav-routes"
import { buttonVariants } from "@workspace/ui/components/ui/button"
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
        className={buttonVariants({
          className:
            "rounded-full bg-accent font-black text-foreground ring-2 ring-surface hover:bg-accent hover:ring-surface-hover",
          size: "icon-sm",
          variant: "secondary",
        })}
        type="button"
      >
        ✍️
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          "w-48 min-w-48 max-w-48",
          "rounded-4xl border-2 border-border bg-bg-elevated p-4",
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
                ? "text-danger-fg focus:text-danger-fg data-highlighted:text-danger-fg"
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
