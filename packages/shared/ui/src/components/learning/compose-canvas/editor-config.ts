import { MarkNode } from "@lexical/mark"
import type { InitialConfigType } from "@lexical/react/LexicalComposer"

import { $importPlainText } from "./plain-text"

const composeCanvasTheme = {
  mark: "compose-canvas-mark rounded-sm box-decoration-clone cursor-pointer",
  markOverlap: "compose-canvas-mark-overlap",
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
    nodes: [MarkNode],
    onError(error) {
      throw error
    },
    theme: composeCanvasTheme,
  }
}
