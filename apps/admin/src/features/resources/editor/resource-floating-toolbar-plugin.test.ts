import { describe, expect, it } from "vitest"
import { $getRoot } from "lexical"
import {
  createResourceDocumentEditor,
  readResourceDocumentMarkdown,
  replaceResourceDocumentMarkdown,
} from "@workspace/resource-document/resource-markdown"

import { formatResourceSelection } from "@/features/resources/editor/resource-floating-toolbar-plugin"

describe("자료 편집기 플로팅 서식 도구", () => {
  it("여러 블록 서식에서도 element의 임시 text format을 제거해 GFM 왕복을 보장한다", () => {
    const editor = createResourceDocumentEditor()
    replaceResourceDocumentMarkdown(
      editor,
      "# 브라우저 제목\n\n## 슬래시 소제목"
    )
    editor.update(
      () => {
        const root = $getRoot()
        root.select(0, root.getChildrenSize())
      },
      { discrete: true }
    )

    formatResourceSelection(editor, "bold")

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      markdown: "# **브라우저 제목**\n\n## **슬래시 소제목**",
      status: "valid",
    })
  })
})
