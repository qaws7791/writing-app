import path from "node:path"
import { fileURLToPath } from "node:url"

import { mergeConfig } from "vite"
import type { StorybookConfig } from "@storybook/react-vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, "../../..")

const config: StorybookConfig = {
  stories: [
    "../src/**/*.stories.@(ts|tsx)",
    "../../../packages/ui/src/**/*.stories.@(ts|tsx)",
  ],
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      server: {
        fs: {
          allow: [workspaceRoot],
        },
      },
    })
  },
}

export default config
