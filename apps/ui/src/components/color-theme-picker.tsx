"use client";

import { useEffect, useState } from "react";
import {
  ColorsIcon,
  ComputerIcon,
  Moon02Icon,
  Sun03Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/registry/luma/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/registry/luma/ui/popover";
import { cn } from "@/registry/luma/lib/utils";

const THEME_KEY = "luma-ui-theme";
const COLOR_KEY = "luma-ui-color";
const RADIUS_KEY = "luma-ui-radius";

const COLOR_PRESETS = [
  { id: "black", label: "블랙", swatch: "oklch(0.27 0.01 67)" },
  { id: "blue", label: "블루", swatch: "oklch(0.49 0.14 254)" },
  { id: "red", label: "레드", swatch: "oklch(0.51 0.19 27)" },
  { id: "orange", label: "오렌지", swatch: "oklch(0.55 0.17 45)" },
  { id: "green", label: "그린", swatch: "oklch(0.48 0.12 155)" },
  { id: "yellow", label: "옐로", swatch: "oklch(0.8 0.15 90)" },
  { id: "pink", label: "핑크", swatch: "oklch(0.55 0.18 350)" },
  { id: "purple", label: "퍼플", swatch: "oklch(0.48 0.15 305)" },
] as const;

const THEME_MODES = [
  { id: "light", label: "라이트", icon: Sun03Icon },
  { id: "dark", label: "다크", icon: Moon02Icon },
  { id: "system", label: "시스템", icon: ComputerIcon },
] as const;

const RADIUS_PRESETS = [
  { id: "small", label: "작게", preview: "0.15rem" },
  { id: "medium", label: "보통", preview: "0.35rem" },
  { id: "large", label: "크게", preview: "0.55rem" },
] as const;

type ColorId = (typeof COLOR_PRESETS)[number]["id"];
type ThemeMode = (typeof THEME_MODES)[number]["id"];
type RadiusId = (typeof RADIUS_PRESETS)[number]["id"];

function readColor(): ColorId {
  if (typeof document === "undefined") {
    return "black";
  }

  const attr = document.documentElement.getAttribute("data-color");
  const match = COLOR_PRESETS.find((preset) => preset.id === attr);

  return match?.id ?? "black";
}

function readThemeMode(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);

    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
  } catch {
    // Fall through to system when storage is unavailable.
  }

  return "system";
}

function readRadius(): RadiusId {
  if (typeof document === "undefined") {
    return "medium";
  }

  const attr = document.documentElement.getAttribute("data-radius");
  const match = RADIUS_PRESETS.find((preset) => preset.id === attr);

  return match?.id ?? "medium";
}

function resolveIsDark(mode: ThemeMode) {
  if (mode === "dark") {
    return true;
  }

  if (mode === "light") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyThemeMode(mode: ThemeMode) {
  const isDark = resolveIsDark(mode);

  document.documentElement.classList.toggle("dark", isDark);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", isDark ? "#171717" : "#ffffff");

  try {
    window.localStorage.setItem(THEME_KEY, mode);
  } catch {
    // Keep the active theme even when storage is unavailable.
  }
}

function applyColor(id: ColorId) {
  if (id === "black") {
    document.documentElement.removeAttribute("data-color");
  } else {
    document.documentElement.setAttribute("data-color", id);
  }

  try {
    window.localStorage.setItem(COLOR_KEY, id);
  } catch {
    // Keep the active color even when storage is unavailable.
  }
}

function applyRadius(id: RadiusId) {
  if (id === "medium") {
    document.documentElement.removeAttribute("data-radius");
  } else {
    document.documentElement.setAttribute("data-radius", id);
  }

  try {
    window.localStorage.setItem(RADIUS_KEY, id);
  } catch {
    // Keep the active radius even when storage is unavailable.
  }
}

export default function ColorThemePicker() {
  const [color, setColor] = useState<ColorId>("black");
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [radius, setRadius] = useState<RadiusId>("medium");

  useEffect(() => {
    setColor(readColor());
    setThemeMode(readThemeMode());
    setRadius(readRadius());
  }, []);

  useEffect(() => {
    if (themeMode !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function onChange() {
      applyThemeMode("system");
    }

    media.addEventListener("change", onChange);

    return () => media.removeEventListener("change", onChange);
  }, [themeMode]);

  function selectColor(id: ColorId) {
    applyColor(id);
    setColor(id);
  }

  function selectThemeMode(mode: ThemeMode) {
    applyThemeMode(mode);
    setThemeMode(mode);
  }

  function selectRadius(id: RadiusId) {
    applyRadius(id);
    setRadius(id);
  }

  const themeIndex = THEME_MODES.findIndex((mode) => mode.id === themeMode);
  const radiusIndex = RADIUS_PRESETS.findIndex((preset) => preset.id === radius);

  return (
    <Popover>
      <PopoverTrigger
        render={<Button type="button" variant="outline" size="icon-sm" />}
        aria-label="외관"
      >
        <HugeiconsIcon icon={ColorsIcon} strokeWidth={1.8} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 gap-4 p-3">
        <PopoverHeader className="px-1">
          <PopoverTitle className="text-sm">외관</PopoverTitle>
        </PopoverHeader>

        <div className="flex items-center justify-between gap-3 px-1">
          <span className="text-sm text-muted-foreground">모드</span>
          <fieldset className="relative m-0 grid grid-cols-3 rounded-full border-0 bg-muted p-0.5">
            <legend className="sr-only">밝기 모드</legend>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc((100%-0.25rem)/3)] rounded-full bg-background shadow-xs transition-transform duration-200 ease-out"
              style={{ transform: `translateX(${Math.max(themeIndex, 0) * 100}%)` }}
            />
            {THEME_MODES.map((mode) => {
              const selected = themeMode === mode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  aria-label={mode.label}
                  aria-pressed={selected}
                  title={mode.label}
                  onClick={() => selectThemeMode(mode.id)}
                  className={cn(
                    "relative z-10 grid size-7 place-items-center rounded-full text-muted-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/40",
                    selected && "text-foreground",
                  )}
                >
                  <HugeiconsIcon icon={mode.icon} strokeWidth={1.8} className="size-3.5" />
                </button>
              );
            })}
          </fieldset>
        </div>

        <div className="flex items-center justify-between gap-3 px-1">
          <span className="text-sm text-muted-foreground">모서리</span>
          <fieldset className="relative m-0 grid grid-cols-3 rounded-full border-0 bg-muted p-0.5">
            <legend className="sr-only">모서리 둥글기</legend>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc((100%-0.25rem)/3)] rounded-full bg-background shadow-xs transition-transform duration-200 ease-out"
              style={{ transform: `translateX(${Math.max(radiusIndex, 0) * 100}%)` }}
            />
            {RADIUS_PRESETS.map((preset) => {
              const selected = radius === preset.id;

              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-label={preset.label}
                  aria-pressed={selected}
                  title={preset.label}
                  onClick={() => selectRadius(preset.id)}
                  className={cn(
                    "relative z-10 grid size-7 place-items-center rounded-full text-muted-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/40",
                    selected && "text-foreground",
                  )}
                >
                  <span
                    aria-hidden
                    className="size-3.5 border border-current"
                    style={{ borderRadius: preset.preview }}
                  />
                </button>
              );
            })}
          </fieldset>
        </div>

        <div className="grid grid-cols-4 gap-2" aria-label="색상 프리셋">
          {COLOR_PRESETS.map((preset) => {
            const selected = color === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                aria-label={preset.label}
                title={preset.label}
                onClick={() => selectColor(preset.id)}
                className={cn(
                  "relative grid size-10 place-items-center rounded-2xl border border-transparent outline-none transition-[box-shadow,border-color] duration-125 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25",
                  selected && "ring-2 ring-foreground/25",
                )}
              >
                <span
                  className="size-6 rounded-full shadow-xs"
                  style={{ backgroundColor: preset.swatch }}
                />
                {selected ? (
                  <span className="absolute inset-0 grid place-items-center text-white mix-blend-difference">
                    <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.2} className="size-3.5" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
