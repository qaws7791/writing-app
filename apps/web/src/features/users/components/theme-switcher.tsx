"use client"

import { useState } from "react"
import { Sun, Smartphone, Moon, Zap } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Switch } from "@workspace/ui/components/ui/switch"
import { Divider } from "./setting-row"

const THEME_OPTIONS: { value: string; icon: LucideIcon; label: string }[] = [
  { value: "light", icon: Sun, label: "라이트" },
  { value: "system", icon: Smartphone, label: "디바이스" },
  { value: "dark", icon: Moon, label: "다크" },
]

export function ThemeSwitcher() {
  const [reduceMotion, setReduceMotion] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <>
      <div className="flex w-full items-center gap-4 px-6 py-5">
        <Sun size={20} strokeWidth={1.5} className="shrink-0 text-foreground" />
        <span className="flex-1 text-base leading-6 font-medium text-foreground">
          화면 모드
        </span>
        <div className="flex gap-0.5 rounded-full bg-accent p-0.5">
          {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              aria-label={label}
              onClick={() => setTheme(value)}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                theme === value
                  ? "bg-background text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Icon size={14} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>
      <Divider />
      <div className="flex w-full items-center gap-4 px-6 py-5">
        <Zap size={20} strokeWidth={1.5} className="shrink-0 text-foreground" />
        <div className="flex flex-1 flex-col">
          <span className="text-base leading-6 font-medium text-foreground">
            동작 줄이기 모드
          </span>
          <span className="text-xs leading-4 font-medium text-muted-foreground">
            화면 움직임을 최소화합니다
          </span>
        </div>
        <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
      </div>
    </>
  )
}
