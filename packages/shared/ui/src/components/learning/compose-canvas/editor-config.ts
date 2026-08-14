import type { InitialConfigType } from "@lexical/react/LexicalComposer"

import { $importPlainText } from "./plain-text"

const composeCanvasTheme = {
  paragraph: "compose-canvas-paragraph mb-5 last:mb-0",
} as const

export function createComposeCanvasConfig(options: {
  readonly editable: boolean
  readonly initialText: string
}): InitialConfigType {
  return {
    editable: options.editable,
    editorState: () => {
      $importPlainText(options.initialText)
    },
    namespace: "ComposeCanvas",
    onError(error) {
      throw error
    },
    theme: composeCanvasTheme,
  }
}
