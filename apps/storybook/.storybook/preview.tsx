import * as React from "react"
import { useEffect } from "react"
import type { Preview } from "@storybook/react-vite"

import "@workspace/ui/globals.css"

type ThemeName = "light" | "dark" | "system"

function resolveTheme(theme: ThemeName): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  }
  return theme
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
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

      useEffect(() => {
        const resolved = resolveTheme(theme)
        const root = document.documentElement

        root.classList.remove("light", "dark")
        root.classList.add(resolved)
      }, [theme])

      // Listen for system theme changes when in "system" mode
      useEffect(() => {
        if (theme !== "system") return

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

        const handleChange = (e: MediaQueryListEvent) => {
          const root = document.documentElement

          root.classList.remove("light", "dark")
          root.classList.add(e.matches ? "dark" : "light")
        }

        mediaQuery.addEventListener("change", handleChange)
        return () => mediaQuery.removeEventListener("change", handleChange)
      }, [theme])

      return (
        <div
          className="antialiased"
          style={{
            fontFamily:
              '"Noto Sans KR", "Noto Sans", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
          }}
        >
          <Story />
        </div>
      )
    },
  ],
}

export default preview
