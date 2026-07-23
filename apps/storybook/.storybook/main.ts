import path from "node:path"
import { fileURLToPath } from "node:url"

import { mergeConfig } from "vite"
import type { StorybookConfig } from "@storybook/react-vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, "../../..")
const STORYBOOK_BUNDLED_SOURCE_REGEX = /\.[cm]?[jt]sx?$/
const USE_CLIENT_DIRECTIVE_REGEX = /^(["'])use client\1;?\s*/

function stripUseClientDirectiveForStorybook() {
  return {
    name: "storybook-strip-use-client-directives",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      if (!STORYBOOK_BUNDLED_SOURCE_REGEX.test(id)) {
        return null
      }

      if (!USE_CLIENT_DIRECTIVE_REGEX.test(code)) {
        return null
      }

      return {
        code: code.replace(USE_CLIENT_DIRECTIVE_REGEX, ""),
        map: null,
      }
    },
  }
}

const config: StorybookConfig = {
  stories: ["../src/docs/**/*.mdx", "../src/stories/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
    },
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      server: {
        fs: {
          allow: [workspaceRoot],
        },
      },
      resolve: {
        alias: {
          "#ui": path.resolve(workspaceRoot, "packages/shared/ui/src"),
          "#storybook": path.resolve(workspaceRoot, "apps/storybook/src"),
          "#storybook-config": path.resolve(
            workspaceRoot,
            "apps/storybook/.storybook"
          ),
          "#storybook-root": path.resolve(workspaceRoot, "apps/storybook"),
        },
      },
      plugins: [stripUseClientDirectiveForStorybook()],
    })
  },
}

export default config
