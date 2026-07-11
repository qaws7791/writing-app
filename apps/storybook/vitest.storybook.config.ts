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
          include: ["@storybook/addon-a11y/preview"],
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
