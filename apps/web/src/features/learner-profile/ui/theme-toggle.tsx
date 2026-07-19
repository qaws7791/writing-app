"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"

import { MonitorIcon, MoonIcon, SunIcon } from "@workspace/ui/components/icons"
import { buttonVariants } from "@workspace/ui/components/ui/button"
import { cn } from "@workspace/ui/lib/utils"

const THEME_OPTIONS = [
  { Icon: SunIcon, label: "라이트", value: "light" },
  { Icon: MoonIcon, label: "다크", value: "dark" },
  { Icon: MonitorIcon, label: "시스템", value: "system" },
] as const
const noopSubscribe = () => () => {}
const clientMountedSnapshot = () => true
const serverMountedSnapshot = () => false

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const mounted = useSyncExternalStore(
    noopSubscribe,
    clientMountedSnapshot,
    serverMountedSnapshot
  )
  const active = mounted ? theme : "system"

  return (
    <div
      aria-label="화면 테마"
      className="grid grid-cols-3 gap-2 rounded-4xl bg-surface p-2"
      role="group"
    >
      {THEME_OPTIONS.map(({ Icon, label, value }) => {
        const isActive = active === value

        return (
          <button
            aria-pressed={isActive}
            className={buttonVariants({
              className: cn(
                "h-auto flex-col gap-2 rounded-[1.75rem] py-4 text-body-sm",
                isActive
                  ? "bg-accent text-charcoal hover:bg-accent"
                  : "text-muted-foreground hover:bg-surface-hover"
              ),
              variant: isActive ? "secondary" : "ghost",
            })}
            key={value}
            onClick={() => setTheme(value)}
            type="button"
          >
            <Icon size={22} strokeWidth={2.5} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
