import * as React from "react"
import {
  DocsContainer,
  type DocsContainerProps,
} from "@storybook/addon-docs/blocks"
import type { Preview } from "@storybook/react-vite"
import { addons } from "storybook/preview-api"

import "../styles.css"
import { getStorybookTheme, type ThemeName } from "./storybook-theme"

const GLOBALS_UPDATED = "globalsUpdated"

function ThemedDocsContainer({
  children,
  context,
}: React.PropsWithChildren<DocsContainerProps>) {
  const [theme, setTheme] = React.useState<ThemeName | undefined>(() => {
    try {
      const story = context.storyById()
      const storyContext = context.getStoryContext(story)
      return storyContext.globals.theme as ThemeName | undefined
    } catch {
      return undefined
    }
  })

  React.useEffect(() => {
    const channel = addons.getChannel()
    const handleGlobalsUpdated = ({
      globals,
    }: {
      globals: Record<string, unknown>
    }) => {
      setTheme(globals.theme as ThemeName | undefined)
    }
    channel.on(GLOBALS_UPDATED, handleGlobalsUpdated)
    return () => {
      channel.off(GLOBALS_UPDATED, handleGlobalsUpdated)
    }
  }, [])

  return (
    <DocsContainer context={context} theme={getStorybookTheme(theme)}>
      {children}
    </DocsContainer>
  )
}

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
    docs: {
      container: ThemedDocsContainer,
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

      React.useEffect(() => {
        const html = document.documentElement

        if (theme === "dark") {
          html.classList.add("dark")
          return
        }

        if (theme === "light") {
          html.classList.remove("dark")
          return
        }

        // system
        const mq = window.matchMedia("(prefers-color-scheme: dark)")
        html.classList.toggle("dark", mq.matches)
        const listener = (e: MediaQueryListEvent) =>
          html.classList.toggle("dark", e.matches)
        mq.addEventListener("change", listener)
        return () => mq.removeEventListener("change", listener)
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
