import * as React from "react"
import type { Preview } from "@storybook/react-vite"
import { ThemeProvider } from "@workspace/ui/components/ui/theme-provider"

import "../styles.css"

type ThemeName = "light" | "dark" | "system"

const preview: Preview = {
  tags: ["autodocs"],
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

      return (
        <ThemeProvider
          forcedTheme={theme === "system" ? undefined : theme}
          defaultTheme={theme}
        >
          <div
            className="antialiased"
            style={{
              fontFamily:
                '"Noto Sans KR", "Noto Sans", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
            }}
          >
            <Story />
          </div>
        </ThemeProvider>
      )
    },
  ],
}

export default preview
