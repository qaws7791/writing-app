import * as React from "react"
import type { Preview } from "@storybook/react-vite"
import { ThemeProvider as NextThemesProvider } from "next-themes"

import "@workspace/ui/globals.css"

type ThemeName = "light" | "dark" | "system"

function ThemeProvider({
  children,
  forcedTheme,
}: {
  children: React.ReactNode
  forcedTheme?: Exclude<ThemeName, "system">
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
      forcedTheme={forcedTheme}
    >
      {children}
    </NextThemesProvider>
  )
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "fullscreen",
    options: {
      storySort: {
        order: ["Foundations", "Components", "Patterns"],
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Design system theme",
      toolbar: {
        title: "Theme",
        items: [
          { value: "system", title: "System" },
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "system",
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme as ThemeName
      const forcedTheme = theme === "system" ? undefined : theme

      return (
        <ThemeProvider forcedTheme={forcedTheme}>
          <div
            style={{
              fontFamily:
                '"Noto Sans", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
            }}
            className="min-h-screen bg-background text-foreground antialiased"
          >
            <div className="min-h-screen p-6 sm:p-10">
              <Story />
            </div>
          </div>
        </ThemeProvider>
      )
    },
  ],
}

export default preview
