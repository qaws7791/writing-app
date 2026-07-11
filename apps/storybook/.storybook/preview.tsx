import * as React from "react"
import {
  DocsContainer,
  type DocsContainerProps,
} from "@storybook/addon-docs/blocks"
import type { Preview } from "@storybook/react-vite"
import "@workspace/ui/pretendard-font"
import { addons } from "storybook/preview-api"

import "../styles.css"
import { getStorybookTheme, type ThemeName } from "./storybook-theme"
import { viewports } from "./viewports"

const GLOBALS_UPDATED = "globalsUpdated"
type MotionName = "full" | "reduced"

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
    a11y: {
      context: {
        exclude: ["[data-base-ui-focus-guard]"],
      },
      options: {
        rules: {
          "color-contrast": { enabled: false },
        },
      },
      test: "error",
    },
    viewport: {
      viewports,
    },
    options: {
      storySort: {
        order: [
          "Getting Started",
          "Foundations",
          "Components",
          "Patterns",
          "Interactions",
          "Recipes",
          "Quality",
          "Migration",
        ],
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
    motion: {
      description: "Motion preference",
      toolbar: {
        title: "Motion",
        items: [
          { value: "full", title: "Full" },
          { value: "reduced", title: "Reduced" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    motion: "full",
    theme: "system",
  },
  decorators: [
    (Story, context) => {
      const motion = context.globals.motion as MotionName
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
          className="storybook-root antialiased"
          data-motion={motion}
          style={{
            fontFamily: "var(--font-sans)",
          }}
        >
          <Story />
        </div>
      )
    },
  ],
}

export default preview
