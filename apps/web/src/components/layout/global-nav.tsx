"use client"

import Link from "next/link"

import { GlobalNavAccountMenu } from "@/components/layout/global-nav-account-menu"
import { GlobalNavBrand } from "@/components/layout/global-nav-brand"
import {
  type GlobalNavPathProps,
  useGlobalNavCurrentPath,
} from "@/components/layout/global-nav-current-path"
import {
  globalNavPrimaryItems,
  isGlobalNavRouteActive,
} from "@/components/layout/global-nav-routes"
import { buttonVariants } from "@workspace/ui/components/ui/button"

export { MobileNav } from "@/components/layout/mobile-nav"

export function GlobalNav({ currentPath }: GlobalNavPathProps) {
  const pathname = useGlobalNavCurrentPath(currentPath)

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-surface/50 bg-background/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 md:px-12 h-14 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <GlobalNavBrand />
          <nav className="hidden sm:flex gap-2">
            {globalNavPrimaryItems.map((item) => (
              <Link
                aria-current={
                  isGlobalNavRouteActive(pathname, item.key)
                    ? "page"
                    : undefined
                }
                className={buttonVariants({
                  className: isGlobalNavRouteActive(pathname, item.key)
                    ? "h-auto rounded-full bg-surface px-4 py-2 text-body-sm text-foreground hover:bg-surface"
                    : "h-auto rounded-full px-4 py-2 text-body-sm text-muted-foreground hover:bg-surface/50",
                  size: "sm",
                  variant: isGlobalNavRouteActive(pathname, item.key)
                    ? "secondary"
                    : "ghost",
                })}
                href={item.href}
                key={item.key}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <GlobalNavAccountMenu />
        </div>
      </div>
    </header>
  )
}
