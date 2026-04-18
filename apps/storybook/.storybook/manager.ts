import { GLOBALS_UPDATED } from "storybook/internal/core-events"
import { addons } from "storybook/manager-api"

import { getStorybookTheme, type ThemeName } from "./storybook-theme"

function applyTheme(themeName?: ThemeName) {
  addons.setConfig({
    theme: getStorybookTheme(themeName),
  })
}

applyTheme()

addons.register("workspace/storybook-theme-sync", (api) => {
  applyTheme(api.getGlobals().theme as ThemeName | undefined)

  api.on(GLOBALS_UPDATED, ({ globals }) => {
    applyTheme(globals.theme as ThemeName | undefined)
  })
})
