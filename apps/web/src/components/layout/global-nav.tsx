"use client"

import { useState } from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  BookOpenIcon,
  HomeIcon,
  UserIcon,
} from "@workspace/ui/components/icons"

type GlobalNavProps = {
  readonly currentPath?: string
}

const routeMap = {
  home: "/app",
  learn: "/app/courses",
  profile: "/app/profile",
} as const

function cx(...classes: Array<false | null | string | undefined>): string {
  return classes.filter(Boolean).join(" ")
}

function useActivePath(currentPath?: string) {
  const pathname = usePathname()

  return currentPath ?? pathname
}

function isActive(pathname: string, key: keyof typeof routeMap): boolean {
  if (key === "learn") {
    return pathname === routeMap.learn || pathname.startsWith("/app/courses/")
  }

  return pathname === routeMap[key]
}

export function GlobalNav({ currentPath }: GlobalNavProps) {
  const pathname = useActivePath(currentPath)
  const [menu, setMenu] = useState(false)

  return (
    <header className="w-full bg-cream sticky top-0 z-40 border-b-2 border-surface/50 backdrop-blur-md bg-opacity-90">
      <div className="max-w-6xl mx-auto px-4 md:px-12 h-14 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link
            className="font-black tracking-tighter btn-squish"
            href={routeMap.home}
            style={{ fontSize: "1.375rem" }}
          >
            글결.
          </Link>
          <nav className="hidden sm:flex gap-2">
            {(
              [
                ["home", "홈"],
                ["learn", "배우기"],
              ] as const
            ).map(([key, label]) => (
              <Link
                aria-current={isActive(pathname, key) ? "page" : undefined}
                className={cx(
                  "px-4 py-2 rounded-full font-bold btn-squish",
                  isActive(pathname, key)
                    ? "bg-surface text-charcoal"
                    : "text-muted hover:bg-surface/50"
                )}
                href={routeMap[key]}
                key={key}
                style={{ fontSize: "0.9375rem" }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              className="w-9 h-9 bg-primary rounded-full flex justify-center items-center font-black btn-squish ring-2 ring-surface hover:ring-surface-hover"
              onClick={() => setMenu(!menu)}
              style={{ fontSize: "0.9375rem" }}
              type="button"
            >
              ✍️
            </button>
            {menu ? (
              <div className="absolute right-0 top-12 bg-cream border-2 border-surface rounded-4xl p-4 w-48 z-50">
                <Link
                  className="block w-full text-left font-bold py-3 px-4 rounded-3xl hover:bg-surface"
                  href={routeMap.profile}
                  onClick={() => setMenu(false)}
                >
                  프로필
                </Link>
                <Link
                  className="block w-full text-left font-bold py-3 px-4 rounded-3xl hover:bg-surface text-coral-dark"
                  href="/login"
                  onClick={() => setMenu(false)}
                >
                  로그아웃
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}

export function MobileNav({ currentPath }: GlobalNavProps) {
  const pathname = useActivePath(currentPath)
  const items = [
    ["home", "홈", HomeIcon],
    ["learn", "배우기", BookOpenIcon],
    ["profile", "프로필", UserIcon],
  ] as const

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 bg-cream border-t-2 border-surface z-40 px-4 py-2 flex justify-around items-center"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {items.map(([key, label, Icon]) => (
        <Link
          aria-current={isActive(pathname, key) ? "page" : undefined}
          className={cx(
            "flex flex-col items-center gap-0.5 font-bold transition-colors",
            isActive(pathname, key) ? "text-charcoal" : "text-muted"
          )}
          href={routeMap[key]}
          key={key}
          style={{ fontSize: "0.6875rem" }}
        >
          <div
            className={cx(
              "w-7 h-7 rounded-full flex justify-center items-center transition-colors",
              isActive(pathname, key) ? "bg-primary text-ink" : "bg-transparent"
            )}
          >
            <Icon size={16} />
          </div>
          <span className="mt-0.5">{label}</span>
        </Link>
      ))}
    </nav>
  )
}
