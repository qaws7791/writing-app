"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"

import {
  ThemeSelector,
  type ThemeValue,
} from "@workspace/ui/components/ui/theme-selector"
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
