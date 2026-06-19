"use client"

import Link from "next/link"

import { GlobalNavAccountMenu } from "@/components/layout/global-nav-account-menu"
import { GlobalNavBrand } from "@/components/layout/global-nav-brand"
import { globalNavClassName } from "@/components/layout/global-nav-class-name"
import {
  type GlobalNavPathProps,
  useGlobalNavCurrentPath,
} from "@/components/layout/global-nav-current-path"
import {
  globalNavPrimaryItems,
  isGlobalNavRouteActive,
} from "@/components/layout/global-nav-routes"

export { MobileNav } from "@/components/layout/mobile-nav"

export function GlobalNav({ currentPath }: GlobalNavPathProps) {
  const pathname = useGlobalNavCurrentPath(currentPath)

  return (
    <header className="w-full bg-cream sticky top-0 z-40 border-b-2 border-surface/50 backdrop-blur-md bg-opacity-90">
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
                className={globalNavClassName(
                  "px-4 py-2 rounded-full font-bold btn-squish",
                  isGlobalNavRouteActive(pathname, item.key)
                    ? "bg-surface text-charcoal"
                    : "text-muted hover:bg-surface/50"
                )}
                href={item.href}
                key={item.key}
                style={{ fontSize: "0.9375rem" }}
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
