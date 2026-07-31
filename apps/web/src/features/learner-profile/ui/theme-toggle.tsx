"use client"

import { useTheme } from "next-themes"

import { useIsHydrated } from "@/shared/hooks/use-is-hydrated"
import {
  ThemeSelector,
  type ThemeValue,
} from "@workspace/ui/components/ui/theme-selector"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const mounted = useIsHydrated()
  const active = mounted && isThemeValue(theme) ? theme : "system"

  return (
    <ThemeSelector
      activeTheme={active}
      disabled={!mounted}
      onThemeChange={setTheme}
    />
  )
}

function isThemeValue(theme: string | undefined): theme is ThemeValue {
  return theme === "dark" || theme === "light" || theme === "system"
}
