import { describe, expect, it } from "vitest"

type ContrastPair = {
  readonly background: string
  readonly foreground: string
  readonly minRatio: number
  readonly name: string
}

const textContrastPairs: ContrastPair[] = [
  {
    background: "#fdfbf7",
    foreground: "#2a2621",
    minRatio: 4.5,
    name: "light fg-default on bg-canvas",
  },
  {
    background: "#1b1916",
    foreground: "#f4efe6",
    minRatio: 4.5,
    name: "dark fg-default on bg-canvas",
  },
  {
    background: "#2a2621",
    foreground: "#fdfbf7",
    minRatio: 4.5,
    name: "light action primary",
  },
  {
    background: "#f4efe6",
    foreground: "#2a2621",
    minRatio: 4.5,
    name: "dark action primary",
  },
  {
    background: "#ffc800",
    foreground: "#2a2621",
    minRatio: 4.5,
    name: "action selected",
  },
  {
    background: "#52d86a",
    foreground: "#084d1c",
    minRatio: 4.5,
    name: "light success",
  },
  {
    background: "#1e5b30",
    foreground: "#6fe588",
    minRatio: 4.5,
    name: "dark success",
  },
  {
    background: "#ffada7",
    foreground: "#8b1d0f",
    minRatio: 4.5,
    name: "light danger",
  },
  {
    background: "#6e2a22",
    foreground: "#ffada7",
    minRatio: 4.5,
    name: "dark danger",
  },
  {
    background: "#dbeafe",
    foreground: "#1d4ed8",
    minRatio: 4.5,
    name: "light info",
  },
  {
    background: "#1e3a5f",
    foreground: "#bfdbfe",
    minRatio: 4.5,
    name: "dark info",
  },
]

function hexToRgb(hex: string): readonly [number, number, number] {
  const value = hex.replace("#", "")

  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}

function getRelativeLuminance(hex: string): number {
  const [red, green, blue] = hexToRgb(hex)
  const normalize = (channel: number) => {
    const normalized = channel / 255

    if (normalized <= 0.03928) {
      return normalized / 12.92
    }

    return ((normalized + 0.055) / 1.055) ** 2.4
  }

  return (
    0.2126 * normalize(red) +
    0.7152 * normalize(green) +
    0.0722 * normalize(blue)
  )
}

function getContrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = getRelativeLuminance(foreground)
  const backgroundLuminance = getRelativeLuminance(background)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

describe("semantic color contrast", () => {
  it.each(textContrastPairs)(
    "$name has at least $minRatio:1 contrast",
    ({ background, foreground, minRatio }) => {
      expect(getContrastRatio(foreground, background)).toBeGreaterThanOrEqual(
        minRatio
      )
    }
  )
})
