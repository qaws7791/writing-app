"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Sun01Icon,
  SmartPhone01Icon,
  Moon02Icon,
  Motion01Icon,
} from "@hugeicons/core-free-icons"
import { useTheme } from "next-themes"
import { Switch } from "@workspace/ui/components/switch"
import { Divider } from "./setting-row"

const THEME_OPTIONS = [
  { value: "light", icon: Sun01Icon, label: "라이트" },
  { value: "system", icon: SmartPhone01Icon, label: "디바이스" },
  { value: "dark", icon: Moon02Icon, label: "다크" },
] as const

export function ThemeSwitcher() {
  const [reduceMotion, setReduceMotion] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <>
      <div className="flex w-full items-center gap-4 px-6 py-5">
        <HugeiconsIcon
          icon={Sun01Icon}
          size={20}
          color="currentColor"
          strokeWidth={1.5}
          className="shrink-0 text-foreground"
        />
        <span className="flex-1 text-base leading-6 font-medium text-foreground">
          화면 모드
        </span>
        <div className="flex gap-0.5 rounded-full bg-surface-tertiary p-0.5">
          {THEME_OPTIONS.map(({ value, icon, label }) => (
            <button
              key={value}
              aria-label={label}
              onClick={() => setTheme(value)}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                theme === value ? "bg-surface text-foreground" : "text-muted"
              }`}
            >
              <HugeiconsIcon
                icon={icon}
                size={14}
                color="currentColor"
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
      </div>
      <Divider />
      <div className="flex w-full items-center gap-4 px-6 py-5">
        <HugeiconsIcon
          icon={Motion01Icon}
          size={20}
          color="currentColor"
          strokeWidth={1.5}
          className="shrink-0 text-foreground"
        />
        <div className="flex flex-1 flex-col">
          <span className="text-base leading-6 font-medium text-foreground">
            동작 줄이기 모드
          </span>
          <span className="text-xs leading-4 font-medium text-muted">
            화면 움직임을 최소화합니다
          </span>
        </div>
        <Switch isSelected={reduceMotion} onChange={setReduceMotion} size="sm">
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>
    </>
  )
}
