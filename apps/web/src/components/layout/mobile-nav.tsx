"use client"

import Link from "next/link"

import {
  BookOpenIcon,
  HomeIcon,
  UserIcon,
} from "@workspace/ui/components/icons"

import { globalNavClassName } from "@/components/layout/global-nav-class-name"
import {
  type GlobalNavPathProps,
  useGlobalNavCurrentPath,
} from "@/components/layout/global-nav-current-path"
import {
  type GlobalNavRouteKey,
  globalNavMobileItems,
  isGlobalNavRouteActive,
} from "@/components/layout/global-nav-routes"

const mobileNavIcons = {
  home: HomeIcon,
  learn: BookOpenIcon,
  profile: UserIcon,
} as const satisfies Record<GlobalNavRouteKey, typeof HomeIcon>

export function MobileNav({ currentPath }: GlobalNavPathProps) {
  const pathname = useGlobalNavCurrentPath(currentPath)

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 bg-cream border-t-2 border-surface z-40 px-4 py-2 flex justify-around items-center"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {globalNavMobileItems.map((item) => {
        const Icon = mobileNavIcons[item.key]
        const isActive = isGlobalNavRouteActive(pathname, item.key)

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={globalNavClassName(
              "flex flex-col items-center gap-0.5 font-bold transition-colors",
              isActive ? "text-charcoal" : "text-muted"
            )}
            href={item.href}
            key={item.key}
            style={{ fontSize: "0.6875rem" }}
          >
            <div
              className={globalNavClassName(
                "w-7 h-7 rounded-full flex justify-center items-center transition-colors",
                isActive ? "bg-primary text-ink" : "bg-transparent"
              )}
            >
              <Icon size={16} />
            </div>
            <span className="mt-0.5">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
