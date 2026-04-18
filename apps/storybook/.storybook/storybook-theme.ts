import { create, type ThemeVars } from "storybook/theming"

type ThemeName = "light" | "dark" | "system"

const accentColor = "#006FEE"
const fontBase =
  '"Noto Sans KR", "Noto Sans", "Apple SD Gothic Neo", "Malgun Gothic", ui-sans-serif, system-ui, sans-serif'
const fontCode = '"JetBrains Mono", "Fira Code", ui-monospace, monospace'

const lightTheme = create({
  base: "light",
  brandTitle: "글필 Design System",
  brandUrl: "/",

  colorPrimary: accentColor,
  colorSecondary: accentColor,

  appBg: "#f5f5f5",
  appContentBg: "#ffffff",
  appPreviewBg: "#f5f5f5",
  appBorderColor: "#e5e5e5",
  appBorderRadius: 8,

  fontBase,
  fontCode,

  textColor: "#1a1a1a",
  textInverseColor: "#f5f5f5",
  textMutedColor: "#6b7280",

  barTextColor: "#6b7280",
  barHoverColor: "#1a1a1a",
  barSelectedColor: accentColor,
  barBg: "#ffffff",

  inputBg: "#ffffff",
  inputBorder: "#e5e5e5",
  inputTextColor: "#1a1a1a",
  inputBorderRadius: 6,
})

const darkTheme = create({
  base: "dark",
  brandTitle: "글필 Design System",
  brandUrl: "/",

  colorPrimary: accentColor,
  colorSecondary: accentColor,

  appBg: "#0f0f13",
  appContentBg: "#19191f",
  appPreviewBg: "#0f0f13",
  appBorderColor: "#2d2d35",
  appBorderRadius: 8,

  fontBase,
  fontCode,

  textColor: "#f5f5f5",
  textInverseColor: "#1a1a1a",
  textMutedColor: "#9ca3af",

  barTextColor: "#9ca3af",
  barHoverColor: "#f5f5f5",
  barSelectedColor: accentColor,
  barBg: "#19191f",

  inputBg: "#19191f",
  inputBorder: "#2d2d35",
  inputTextColor: "#f5f5f5",
  inputBorderRadius: 6,
})

function getStorybookTheme(themeName?: ThemeName): ThemeVars {
  if (themeName === "dark") return darkTheme
  if (themeName === "light") return lightTheme

  const prefersDark =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches

  return prefersDark ? darkTheme : lightTheme
}

export { getStorybookTheme }
export type { ThemeName }
