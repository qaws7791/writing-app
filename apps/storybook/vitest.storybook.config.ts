import path from "node:path"
import { fileURLToPath } from "node:url"

import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vitest/config"

const dirname = path.dirname(fileURLToPath(import.meta.url))

process.env["VITEST_STORYBOOK"] = "false"

const { storybookTest } = await import("@storybook/addon-vitest/vitest-plugin")

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        optimizeDeps: {
          include: [
            "@base-ui/react/accordion",
            "@base-ui/react/alert-dialog",
            "@base-ui/react/button",
            "@base-ui/react/input",
            "@base-ui/react/menu",
            "@base-ui/react/merge-props",
            "@base-ui/react/progress",
            "@base-ui/react/select",
            "@base-ui/react/separator",
            "@base-ui/react/use-render",
            "@storybook/addon-a11y/preview",
            "@storybook/react-vite",
            "lucide-react",
            "react",
            "react/jsx-dev-runtime",
            "storybook/preview-api",
            "storybook/test",
            "storybook/theming",
            "@workspace/ui > class-variance-authority",
            "@workspace/ui > clsx",
            "@workspace/ui > react-markdown",
            "@workspace/ui > tailwind-merge",
          ],
        },
        plugins: [
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
          setupFiles: ["./.storybook/vitest.setup.ts"],
        },
      },
    ],
  },
})
