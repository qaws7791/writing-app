import { createEditor } from "lexical"
import { describe, expect, it } from "vitest"
import { MarkNode, $isMarkNode } from "@lexical/mark"
import { $nodesOfType } from "lexical"

import {
  $findTextRange,
  $unwrapFeedbackMark,
  $wrapFeedbackMark,
} from "./find-text-range"
import { $exportPlainText, $importPlainText } from "./plain-text"

function createTestEditor() {
  return createEditor({
    namespace: "ComposeCanvasMarkTest",
    nodes: [MarkNode],
    onError(error) {
      throw error
    },
  })
}

describe("$findTextRange / $wrapFeedbackMark", () => {
  it("첫 일치 구절을 감싸고 평문 export는 그대로다", () => {
    const editor = createTestEditor()
    editor.update(
      () => {
        $importPlainText("첫 문장입니다.\n반대하는 사람도 있다.\n마지막 문장.")
        expect($wrapFeedbackMark("r0", "반대하는 사람도 있다.")).toBe(true)
      },
      { discrete: true }
    )

    editor.getEditorState().read(() => {
      expect($exportPlainText()).toBe(
        "첫 문장입니다.\n반대하는 사람도 있다.\n마지막 문장."
      )
      const marks = $nodesOfType(MarkNode)
      expect(marks).toHaveLength(1)
      expect(marks[0]?.getIDs()).toEqual(["r0"])
      expect(marks[0] !== undefined && $isMarkNode(marks[0])).toBe(true)
    })
  })

  it("개행이 있거나 본문에 없는 인용은 감싸지 않는다", () => {
    const editor = createTestEditor()
    editor.update(
      () => {
        $importPlainText("한 문단입니다.")
        expect($wrapFeedbackMark("r0", "한\n문단입니다.")).toBe(false)
        expect($wrapFeedbackMark("r1", "없는 구절")).toBe(false)
        expect($findTextRange("")).toBeNull()
      },
      { discrete: true }
    )
  })

  it("제거하면 마크가 사라진다", () => {
    const editor = createTestEditor()
    editor.update(
      () => {
        $importPlainText("반대하는 사람도 있다.")
        $wrapFeedbackMark("r0", "반대하는 사람도 있다.")
        $unwrapFeedbackMark("r0")
      },
      { discrete: true }
    )
    editor.getEditorState().read(() => {
      expect($nodesOfType(MarkNode)).toHaveLength(0)
      expect($exportPlainText()).toBe("반대하는 사람도 있다.")
    })
  })
})
