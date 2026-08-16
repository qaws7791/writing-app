"use client"

import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

import {
  type GlobalNavPathProps,
  useGlobalNavCurrentPath,
} from "@/app/(learner)/app/_views/global-nav-current-path"
import {
  globalNavPrimaryItems,
  isGlobalNavRouteActive,
} from "@/app/(learner)/app/_views/global-nav-routes"

export function GlobalNavLinks({ currentPath }: GlobalNavPathProps) {
  const pathname = useGlobalNavCurrentPath(currentPath)

  return (
    <nav aria-label="주요 메뉴" className="hidden items-center gap-1.5 sm:flex">
      {globalNavPrimaryItems.map((item) => {
        const isActive = isGlobalNavRouteActive(pathname, item.key)

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-w-12 items-center justify-center rounded-xl px-3.5 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/25",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/65 hover:text-foreground"
            )}
            href={item.href}
            key={item.key}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
