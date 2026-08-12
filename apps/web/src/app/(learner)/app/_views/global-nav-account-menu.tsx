"use client"

import Link from "next/link"

import { globalNavAccountItems } from "@/app/(learner)/app/_views/global-nav-routes"
import {
  LogOutIcon,
  UserIcon,
} from "@workspace/ui/components/icons/navigation-icons"
import { Button } from "@workspace/ui/components/primitives/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/primitives/dropdown-menu"

export function GlobalNavAccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="계정 메뉴"
            className="rounded-xl text-base"
            size="icon-sm"
            type="button"
            variant="ghost"
          />
        }
      >
        <span aria-hidden="true">✍️</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 min-w-48" sideOffset={8}>
        {globalNavAccountItems.map((item) => (
          <DropdownMenuItem
            key={item.label}
            className="w-full justify-start"
            render={<Link href={item.href} />}
            variant={item.tone === "danger" ? "destructive" : "default"}
          >
            {item.tone === "danger" ? <LogOutIcon /> : <UserIcon />}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
