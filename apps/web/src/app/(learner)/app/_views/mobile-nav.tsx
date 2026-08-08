"use client"

import Link from "next/link"

import {
  BookOpenIcon,
  FileTextIcon,
  HomeIcon,
  UserIcon,
} from "@workspace/ui/components/icons/navigation-icons"

import {
  type GlobalNavPathProps,
  useGlobalNavCurrentPath,
} from "@/app/(learner)/app/_views/global-nav-current-path"
import {
  globalNavMobileItems,
  isGlobalNavRouteActive,
} from "@/app/(learner)/app/_views/global-nav-routes"
import { cn } from "@workspace/ui/lib/utils"

const mobileNavIcons = {
  home: HomeIcon,
  learn: BookOpenIcon,
  profile: UserIcon,
  writing: FileTextIcon,
} as const

export function MobileNav({ currentPath }: GlobalNavPathProps) {
  const pathname = useGlobalNavCurrentPath(currentPath)

  return (
    <nav
      aria-label="모바일 주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border/60 bg-background/95 px-3 py-2 backdrop-blur-lg sm:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {globalNavMobileItems.map((item) => {
        const Icon = mobileNavIcons[item.key]
        const isActive = isGlobalNavRouteActive(pathname, item.key)

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "min-w-14 rounded-xl px-2 py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/25",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}
            href={item.href}
            key={item.key}
          >
            <span
              className={cn(
                "mx-auto flex size-7 items-center justify-center rounded-xl transition-colors",
                isActive ? "bg-muted text-foreground" : "bg-transparent"
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <span className="mt-0.5 block text-center">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
