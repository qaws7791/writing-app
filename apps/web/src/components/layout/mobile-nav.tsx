"use client"

import Link from "next/link"

import {
  BookOpenIcon,
  HomeIcon,
  UserIcon,
} from "@workspace/ui/components/icons"

import {
  type GlobalNavPathProps,
  useGlobalNavCurrentPath,
} from "@/components/layout/global-nav-current-path"
import {
  type GlobalNavRouteKey,
  globalNavMobileItems,
  isGlobalNavRouteActive,
} from "@/components/layout/global-nav-routes"
import { cn } from "@workspace/ui/lib/utils"

const mobileNavIcons = {
  home: HomeIcon,
  learn: BookOpenIcon,
  profile: UserIcon,
} as const satisfies Record<GlobalNavRouteKey, typeof HomeIcon>

export function MobileNav({ currentPath }: GlobalNavPathProps) {
  const pathname = useGlobalNavCurrentPath(currentPath)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border-subtle bg-bg-canvas px-4 py-2 sm:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {globalNavMobileItems.map((item) => {
        const Icon = mobileNavIcons[item.key]
        const isActive = isGlobalNavRouteActive(pathname, item.key)

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 text-caption font-bold transition-colors",
              isActive ? "text-fg-default" : "text-fg-muted"
            )}
            href={item.href}
            key={item.key}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full flex justify-center items-center transition-colors",
                isActive
                  ? "bg-action-selected-bg text-action-selected-fg"
                  : "bg-transparent"
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
