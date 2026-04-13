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

function getStorybookManualChunk(id: string) {
  const normalizedId = id.replaceAll("\\", "/")

  if (
    normalizedId.includes("/packages/ui/src/") &&
    !normalizedId.includes(".stories.")
  ) {
    return "workspace-ui"
  }

  if (!normalizedId.includes("/node_modules/")) {
    return undefined
  }

  if (normalizedId.includes("/axe-core/")) {
    return "a11y-vendor"
  }

  if (
    normalizedId.includes("/@storybook/") ||
    normalizedId.includes("/storybook/")
  ) {
    return "storybook-vendor"
  }

  if (
    normalizedId.includes("/react-aria-components/") ||
    normalizedId.includes("/@react-aria/") ||
    normalizedId.includes("/@react-stately/")
  ) {
    return "react-aria-vendor"
  }

  if (
    normalizedId.includes("/react/") ||
    normalizedId.includes("/react-dom/")
  ) {
    return "react-vendor"
  }

  if (normalizedId.includes("/motion/")) {
    return "motion-vendor"
  }

  if (
    normalizedId.includes("/@hugeicons/") ||
    normalizedId.includes("/@radix-ui/") ||
    normalizedId.includes("/tailwind-merge/") ||
    normalizedId.includes("/tailwind-variants/")
  ) {
    return "ui-deps-vendor"
  }

  return undefined
}

const config: StorybookConfig = {
  stories: ["../../../packages/ui/src/**/*.stories.@(ts|tsx)"],
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
      build: {
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
          output: {
            manualChunks: getStorybookManualChunk,
          },
        },
      },
      plugins: [stripUseClientDirectiveForStorybook()],
    })
  },
}

export default config
