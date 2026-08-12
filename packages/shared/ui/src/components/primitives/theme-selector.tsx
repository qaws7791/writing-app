"use client"

import {
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from "#ui/components/icons/profile-icons"
import { Button } from "#ui/components/primitives/button"
import { cn } from "#ui/lib/utils"

export type ThemeValue = "dark" | "light" | "system"

const themeOptions = [
  { Icon: SunIcon, label: "라이트", value: "light" },
  { Icon: MoonIcon, label: "다크", value: "dark" },
  { Icon: MonitorIcon, label: "시스템", value: "system" },
] as const

export function ThemeSelector({
  activeTheme,
  className,
  disabled,
  onThemeChange,
}: {
  readonly activeTheme: ThemeValue
  readonly className?: string
  readonly disabled?: boolean
  readonly onThemeChange: (theme: ThemeValue) => void
}) {
  return (
    <div
      aria-label="화면 테마"
      className={cn(
        "grid grid-cols-3 gap-1.5 rounded-3xl bg-muted/70 p-1.5",
        className
      )}
      role="group"
    >
      {themeOptions.map(({ Icon, label, value }) => {
        const isActive = activeTheme === value

        return (
          <Button
            aria-pressed={isActive}
            className={cn(
              "h-auto flex-col gap-2 rounded-2xl py-4",
              isActive
                ? "bg-background text-foreground shadow-xs hover:bg-background"
                : "text-foreground/75 hover:bg-background/55 hover:text-foreground"
            )}
            disabled={disabled}
            key={value}
            onClick={() => onThemeChange(value)}
            type="button"
            variant="ghost"
          >
            <Icon aria-hidden="true" className="size-5" />
            {label}
          </Button>
        )
      })}
    </div>
  )
}
