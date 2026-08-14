import { createEditor } from "lexical"
import { describe, expect, it } from "vitest"

import { $exportPlainText, $importPlainText } from "./plain-text"

function roundTrip(input: string): string {
  const editor = createEditor({
    namespace: "ComposeCanvasTest",
    onError(error) {
      throw error
    },
  })
  editor.update(
    () => {
      $importPlainText(input)
    },
    { discrete: true }
  )
  let output = ""
  editor.getEditorState().read(() => {
    output = $exportPlainText()
  })
  return output
}

describe("$importPlainText / $exportPlainText", () => {
  it.each([
    ["", ""],
    ["한글", "한글"],
    ["첫 문단\n둘째 문단", "첫 문단\n둘째 문단"],
    ["첫 문단\n\n둘째 문단", "첫 문단\n\n둘째 문단"],
    ["끝 개행\n", "끝 개행\n"],
    ["\n시작 개행", "\n시작 개행"],
    ["줄바꿈\r\n섞임", "줄바꿈\n섞임"],
  ])("%j 왕복", (input, expected) => {
    expect(roundTrip(input)).toBe(expected)
  })
})
