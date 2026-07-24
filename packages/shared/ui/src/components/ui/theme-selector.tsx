"use client"

import { MonitorIcon, MoonIcon, SunIcon } from "#ui/components/icons"
import { buttonVariants } from "#ui/components/ui/button"
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
        "grid grid-cols-3 gap-2 rounded-4xl bg-bg-surface p-2",
        className
      )}
      role="group"
    >
      {themeOptions.map(({ Icon, label, value }) => {
        const isActive = activeTheme === value

        return (
          <button
            aria-pressed={isActive}
            className={buttonVariants({
              className: cn(
                "h-auto flex-col gap-2 rounded-[1.75rem] py-4 text-body-sm",
                isActive
                  ? "bg-action-selected-bg text-action-selected-fg hover:bg-action-selected-bg"
                  : "text-fg-muted hover:bg-surface-hover hover:text-fg-default"
              ),
              variant: "ghost",
            })}
            disabled={disabled}
            key={value}
            onClick={() => onThemeChange(value)}
            type="button"
          >
            <Icon aria-hidden="true" size={22} strokeWidth={2.5} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
