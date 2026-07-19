"use client"

import Link from "next/link"

import { buttonVariants } from "@workspace/ui/components/ui/button"

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
    <nav className="hidden sm:flex gap-2">
      {globalNavPrimaryItems.map((item) => {
        const isActive = isGlobalNavRouteActive(pathname, item.key)

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={buttonVariants({
              className: isActive
                ? "h-auto rounded-full bg-surface px-4 py-2 text-body-sm text-foreground hover:bg-surface"
                : "h-auto rounded-full px-4 py-2 text-body-sm text-muted-foreground hover:bg-surface/50",
              size: "sm",
              variant: isActive ? "secondary" : "ghost",
            })}
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
