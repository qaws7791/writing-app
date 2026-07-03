"use client"

import Link from "next/link"

import { globalNavAccountItems } from "@/components/layout/global-nav-routes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu"

export function GlobalNavAccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="bg-accent-soft text-accent" type="button">
        ✍️
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {globalNavAccountItems.map((item) => (
          <DropdownMenuItem
            key={item.label}
            render={<Link href={item.href} />}
            variant={item.tone === "danger" ? "destructive" : "default"}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
