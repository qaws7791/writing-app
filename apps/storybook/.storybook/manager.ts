import { addons } from "storybook/manager-api"
import { create } from "storybook/theming"

const accentColor = "#006FEE"

const lightTheme = create({
  base: "light",
  brandTitle: "글필 Design System",
  brandUrl: "/",

  // UI colors
  colorPrimary: accentColor,
  colorSecondary: accentColor,

  // App
  appBg: "#f5f5f5",
  appContentBg: "#ffffff",
  appPreviewBg: "#f5f5f5",
  appBorderColor: "#e5e5e5",
  appBorderRadius: 8,

  // Typography
  fontBase:
    '"Noto Sans KR", "Noto Sans", "Apple SD Gothic Neo", "Malgun Gothic", ui-sans-serif, system-ui, sans-serif',
  fontCode: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',

  // Text
  textColor: "#1a1a1a",
  textInverseColor: "#f5f5f5",
  textMutedColor: "#6b7280",

  // Toolbar
  barTextColor: "#6b7280",
  barHoverColor: "#1a1a1a",
  barSelectedColor: accentColor,
  barBg: "#ffffff",

  // Form
  inputBg: "#ffffff",
  inputBorder: "#e5e5e5",
  inputTextColor: "#1a1a1a",
  inputBorderRadius: 6,
})

const darkTheme = create({
  base: "dark",
  brandTitle: "글필 Design System",
  brandUrl: "/",

  // UI colors
  colorPrimary: accentColor,
  colorSecondary: accentColor,

  // App
  appBg: "#0f0f13",
  appContentBg: "#19191f",
  appPreviewBg: "#0f0f13",
  appBorderColor: "#2d2d35",
  appBorderRadius: 8,

  // Typography
  fontBase:
    '"Noto Sans KR", "Noto Sans", "Apple SD Gothic Neo", "Malgun Gothic", ui-sans-serif, system-ui, sans-serif',
  fontCode: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',

  // Text
  textColor: "#f5f5f5",
  textInverseColor: "#1a1a1a",
  textMutedColor: "#9ca3af",

  // Toolbar
  barTextColor: "#9ca3af",
  barHoverColor: "#f5f5f5",
  barSelectedColor: accentColor,
  barBg: "#19191f",

  // Form
  inputBg: "#19191f",
  inputBorder: "#2d2d35",
  inputTextColor: "#f5f5f5",
  inputBorderRadius: 6,
})

addons.setConfig({
  theme: lightTheme,
})
