"use client"

import Link from "next/link"

import { globalNavAccountItems } from "@/components/layout/global-nav-routes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu"

export function GlobalNavAccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="size-(--control-height-sm) rounded-control bg-action-selected-bg px-0 text-action-selected-fg ring-2 ring-bg-surface hover:ring-bg-surface-hover"
        type="button"
      >
        ✍️
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {globalNavAccountItems.map((item) => (
          <DropdownMenuLinkItem
            href={item.href}
            key={item.label}
            render={<Link href={item.href} />}
            tone={item.tone === "danger" ? "danger" : "neutral"}
          >
            {item.label}
          </DropdownMenuLinkItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
