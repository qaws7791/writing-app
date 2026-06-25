import { create, type ThemeVars } from "storybook/theming"

type ThemeName = "light" | "dark" | "system"

const accentColor = "#FFC800"
const fontBase =
  "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
const fontCode = '"JetBrains Mono", "Fira Code", ui-monospace, monospace'

const lightTheme = create({
  base: "light",
  brandTitle: "글결 Design System",
  brandUrl: "/",

  colorPrimary: accentColor,
  colorSecondary: accentColor,

  appBg: "#fdfbf7",
  appContentBg: "#fdfbf7",
  appPreviewBg: "#f4efe6",
  appBorderColor: "#eae2d3",
  appBorderRadius: 8,

  fontBase,
  fontCode,

  textColor: "#2a2621",
  textInverseColor: "#fdfbf7",
  textMutedColor: "#524d47",

  barTextColor: "#524d47",
  barHoverColor: "#2a2621",
  barSelectedColor: accentColor,
  barBg: "#fdfbf7",

  inputBg: "#ffffff",
  inputBorder: "#eae2d3",
  inputTextColor: "#2a2621",
  inputBorderRadius: 6,
})

const darkTheme = create({
  base: "dark",
  brandTitle: "글결 Design System",
  brandUrl: "/",

  colorPrimary: accentColor,
  colorSecondary: accentColor,

  appBg: "#1b1916",
  appContentBg: "#1b1916",
  appPreviewBg: "#262320",
  appBorderColor: "#332f2a",
  appBorderRadius: 8,

  fontBase,
  fontCode,

  textColor: "#f4efe6",
  textInverseColor: "#2a2621",
  textMutedColor: "#a89f92",

  barTextColor: "#a89f92",
  barHoverColor: "#f4efe6",
  barSelectedColor: accentColor,
  barBg: "#1b1916",

  inputBg: "#262320",
  inputBorder: "#332f2a",
  inputTextColor: "#f4efe6",
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
