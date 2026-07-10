import { describe, expect, it, vi } from "vitest"
import type { Provider, UserState } from "@lexical/yjs"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isTextNode,
  $setState,
  createState,
  UNDO_COMMAND,
} from "lexical"
import {
  applyUpdate,
  Doc,
  encodeStateAsUpdate,
  Map as YMap,
  mergeUpdates,
  XmlElement,
  XmlText,
} from "yjs"

import {
  connectResourceDocumentCollaboration,
  createHeadlessResourceDocumentCollaboration,
  createResourceDocumentEditor,
  createResourceDocumentSnapshot,
  projectResourceDocumentSnapshot,
  readResourceDocumentMarkdown,
  replaceResourceDocumentMarkdown,
  normalizeResourceMarkdown,
} from "#resource-document/index"

describe("자료 문서 공동 편집 계약", () => {
  it("Yjs snapshot을 headless Lexical에서 같은 Markdown으로 투영한다", () => {
    const markdown = [
      "# 자료실",
      "",
      "문단 **굵게** *기울임* ~~취소선~~ `코드` [링크](https://example.com)",
      "",
      "> 공동 편집 계약",
      "",
      "---",
      "",
      "- [x] Markdown 원본",
      "- [ ] 공동 편집",
      "",
      "1. 첫 번째",
      "2. 두 번째",
      "",
      "```typescript",
      "const ready = true",
      "```",
      "",
      "| 항목 | 상태 |",
      "| :--- | ---: |",
      "| 투영 | 완료 |",
      "",
      "![트리](https://images.example.com/tree.png)",
    ].join("\n")
    const snapshotResult = createResourceDocumentSnapshot(markdown)

    expect(snapshotResult.status).toBe("valid")

    if (snapshotResult.status !== "valid") {
      throw new Error("유효한 Markdown fixture가 거부되었습니다.")
    }

    expect(projectResourceDocumentSnapshot(snapshotResult.snapshot)).toEqual(
      normalizeResourceMarkdown(markdown)
    )
  })

  it("두 Lexical client의 동시 변경이 같은 Markdown으로 수렴한다", () => {
    const snapshotResult = createResourceDocumentSnapshot("기본")

    if (snapshotResult.status !== "valid") {
      throw new Error("유효한 Markdown fixture가 거부되었습니다.")
    }

    const documentA = new Doc()
    const documentB = new Doc()
    const clientA = createHeadlessResourceDocumentCollaboration({
      document: documentA,
      id: "resource-a",
    })
    const clientB = createHeadlessResourceDocumentCollaboration({
      document: documentB,
      id: "resource-b",
    })

    applyUpdate(documentA, snapshotResult.snapshot)
    applyUpdate(documentB, snapshotResult.snapshot)
    readResourceDocumentMarkdown(clientA.editor)
    readResourceDocumentMarkdown(clientB.editor)

    const updatesA: Uint8Array[] = []
    const updatesB: Uint8Array[] = []
    const collectA = (update: Uint8Array) => updatesA.push(update)
    const collectB = (update: Uint8Array) => updatesB.push(update)

    documentA.on("update", collectA)
    documentB.on("update", collectB)

    appendToFirstTextNode(clientA.editor, " A")
    appendToFirstTextNode(clientB.editor, " B")

    documentA.off("update", collectA)
    documentB.off("update", collectB)

    applyUpdate(documentA, mergeUpdates(updatesB))
    applyUpdate(documentB, mergeUpdates(updatesA))

    const markdownA = readResourceDocumentMarkdown(clientA.editor)
    const markdownB = readResourceDocumentMarkdown(clientB.editor)

    expect(markdownA).toEqual(markdownB)
    expect(markdownA.status).toBe("valid")

    if (markdownA.status !== "valid") {
      throw new Error("수렴한 Lexical 문서를 Markdown으로 투영하지 못했습니다.")
    }

    expect(markdownA.markdown).toContain(" A")
    expect(markdownA.markdown).toContain(" B")

    clientA.disconnect()
    clientB.disconnect()
    documentA.destroy()
    documentB.destroy()
  })

  it("undo는 현재 사용자의 변경만 되돌리고 원격 변경은 유지한다", () => {
    const snapshotResult = createResourceDocumentSnapshot("기본")

    if (snapshotResult.status !== "valid") {
      throw new Error("유효한 Markdown fixture가 거부되었습니다.")
    }

    const networkDocument = new Doc()
    const editor = createResourceDocumentEditor()
    const remoteCollaboration = createHeadlessResourceDocumentCollaboration({
      document: networkDocument,
      id: "resource-remote-undo",
    })

    applyUpdate(networkDocument, snapshotResult.snapshot)

    const collaboration = connectResourceDocumentCollaboration({
      document: networkDocument,
      editor,
      id: "resource-local-undo",
      onRemoteValidationChange() {},
      provider: createTestProvider(),
    })
    try {
      expect(readResourceDocumentMarkdown(editor)).toEqual({
        markdown: "기본",
        status: "valid",
      })
      const networkUpdate = vi.fn()

      networkDocument.on("update", networkUpdate)
      appendToFirstTextNode(editor, " 로컬")
      expect(networkUpdate).toHaveBeenCalled()
      expect(readResourceDocumentMarkdown(remoteCollaboration.editor)).toEqual({
        markdown: "기본 로컬",
        status: "valid",
      })
      appendParagraph(remoteCollaboration.editor, "원격")

      expect(readResourceDocumentMarkdown(remoteCollaboration.editor)).toEqual({
        markdown: "기본 로컬\n\n원격",
        status: "valid",
      })
      expect(
        projectResourceDocumentSnapshot(encodeStateAsUpdate(networkDocument))
      ).toEqual({ markdown: "기본 로컬\n\n원격", status: "valid" })
      expect(collaboration.getRemoteValidation()).toEqual({ status: "valid" })
      const merged = readResourceDocumentMarkdown(editor)

      expect(merged.status).toBe("valid")
      if (merged.status === "valid") {
        expect(merged.markdown).toContain("로컬")
        expect(merged.markdown).toContain("원격")
      }

      expect(editor.dispatchCommand(UNDO_COMMAND, undefined)).toBe(true)

      const undone = readResourceDocumentMarkdown(editor)

      expect(undone.status).toBe("valid")
      if (undone.status === "valid") {
        expect(undone.markdown).not.toContain("로컬")
        expect(undone.markdown).toContain("원격")
      }
    } finally {
      remoteCollaboration.disconnect()
      collaboration.disconnect()
      networkDocument.destroy()
    }
  })

  it("재연결 전에 남은 화면 상태를 네트워크 문서와 중복 병합하지 않는다", () => {
    const snapshotResult = createResourceDocumentSnapshot("서버 본문")

    if (snapshotResult.status !== "valid") {
      throw new Error("유효한 Markdown fixture가 거부되었습니다.")
    }

    const document = new Doc()
    const editor = createResourceDocumentEditor()

    expect(replaceResourceDocumentMarkdown(editor, "서버 본문")).toEqual({
      status: "valid",
    })

    const collaboration = connectResourceDocumentCollaboration({
      document,
      editor,
      id: "resource-reconnect-with-residual-editor-state",
      onRemoteValidationChange: () => undefined,
      provider: createTestProvider(),
    })

    try {
      expect(readResourceDocumentMarkdown(editor)).toEqual({
        markdown: "",
        status: "valid",
      })
      applyUpdate(document, snapshotResult.snapshot)

      expect(readResourceDocumentMarkdown(editor)).toEqual({
        markdown: "서버 본문",
        status: "valid",
      })
      expect(
        projectResourceDocumentSnapshot(encodeStateAsUpdate(document))
      ).toEqual({
        markdown: "서버 본문",
        status: "valid",
      })
    } finally {
      collaboration.disconnect()
      document.destroy()
    }
  })

  it("연결을 종료한 화면 editor의 원격 상태를 다음 연결에 남기지 않는다", () => {
    const snapshotResult = createResourceDocumentSnapshot("서버 본문")

    if (snapshotResult.status !== "valid") {
      throw new Error("유효한 Markdown fixture가 거부되었습니다.")
    }

    const document = new Doc()
    const editor = createResourceDocumentEditor()

    applyUpdate(document, snapshotResult.snapshot)

    const collaboration = connectResourceDocumentCollaboration({
      document,
      editor,
      id: "resource-disconnect-clears-editor",
      onRemoteValidationChange: () => undefined,
      provider: createTestProvider(),
    })

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      markdown: "서버 본문",
      status: "valid",
    })

    collaboration.disconnect()

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      markdown: "",
      status: "valid",
    })
    document.destroy()
  })

  it("손상된 snapshot 투영이 실패해도 Yjs 문서를 정리한다", () => {
    const destroy = vi.spyOn(Doc.prototype, "destroy")

    expect(projectResourceDocumentSnapshot(new Uint8Array([255]))).toEqual({
      issues: [{ code: "invalid-collaboration-state" }],
      status: "invalid",
    })
    expect(destroy).toHaveBeenCalledTimes(1)

    destroy.mockRestore()
  })

  it("잘못된 표 정렬 NodeState snapshot을 기본값으로 대체하지 않고 거부한다", () => {
    const snapshotResult = createResourceDocumentSnapshot(
      "| 항목 |\n| --- |\n| 값 |"
    )

    if (snapshotResult.status !== "valid") {
      throw new Error("유효한 Markdown fixture가 거부되었습니다.")
    }

    const document = new Doc()

    try {
      applyUpdate(document, snapshotResult.snapshot)

      const table = findYjsNodeByLexicalType(document, "table")
      const state = table.getAttribute("__state")

      if (!(state instanceof YMap)) {
        throw new Error("표 NodeState를 찾지 못했습니다.")
      }

      state.set("resource-table-column-alignments", ["invalid"])

      expect(
        projectResourceDocumentSnapshot(encodeStateAsUpdate(document))
      ).toEqual({
        issues: [{ code: "invalid-collaboration-state" }],
        status: "invalid",
      })
    } finally {
      document.destroy()
    }
  })

  it("원격 이미지 속성을 headless에서 검증한 뒤에만 화면 editor에 반영한다", () => {
    const markdown = "![대체 텍스트](https://images.example.com/tree.png)"
    const snapshotResult = createResourceDocumentSnapshot(markdown)

    if (snapshotResult.status !== "valid") {
      throw new Error("유효한 Markdown fixture가 거부되었습니다.")
    }

    const document = new Doc()
    const editor = createResourceDocumentEditor()
    const validationChanges: ReturnType<
      ReturnType<
        typeof connectResourceDocumentCollaboration
      >["getRemoteValidation"]
    >[] = []

    applyUpdate(document, snapshotResult.snapshot)

    const collaboration = connectResourceDocumentCollaboration({
      document,
      editor,
      id: "resource-image-validation",
      onRemoteValidationChange: (validation) => {
        validationChanges.push(validation)
      },
      provider: createTestProvider(),
    })

    try {
      expect(readResourceDocumentMarkdown(editor)).toEqual(
        normalizeResourceMarkdown(markdown)
      )

      const image = findYjsNodeByLexicalType(document, "resource-image")

      image.setAttribute("__alt", { bad: true })

      expect(collaboration.getRemoteValidation()).toEqual({
        issues: [
          {
            code: "invalid-resource-image-property",
            property: "alt",
          },
        ],
        status: "invalid",
      })
      expect(readResourceDocumentMarkdown(editor)).toEqual(
        normalizeResourceMarkdown(markdown)
      )

      image.setAttribute("__alt", "복구된 대체 텍스트")

      expect(collaboration.getRemoteValidation()).toEqual({ status: "valid" })
      expect(readResourceDocumentMarkdown(editor)).toEqual(
        normalizeResourceMarkdown(
          "![복구된 대체 텍스트](https://images.example.com/tree.png)"
        )
      )

      image.setAttribute("__url", { bad: true })

      expect(collaboration.getRemoteValidation()).toEqual({
        issues: [
          {
            code: "invalid-resource-image-property",
            property: "url",
          },
        ],
        status: "invalid",
      })
      expect(readResourceDocumentMarkdown(editor)).toEqual(
        normalizeResourceMarkdown(
          "![복구된 대체 텍스트](https://images.example.com/tree.png)"
        )
      )

      image.setAttribute("__url", "http://images.example.com/tree.png")

      expect(collaboration.getRemoteValidation().status).toBe("invalid")
      expect(readResourceDocumentMarkdown(editor)).toEqual(
        normalizeResourceMarkdown(
          "![복구된 대체 텍스트](https://images.example.com/tree.png)"
        )
      )

      image.setAttribute("__url", "https://images.example.com/recovered.png")

      expect(collaboration.getRemoteValidation()).toEqual({ status: "valid" })
      expect(readResourceDocumentMarkdown(editor)).toEqual(
        normalizeResourceMarkdown(
          "![복구된 대체 텍스트](https://images.example.com/recovered.png)"
        )
      )

      image.setAttribute("__alt", "")

      expect(collaboration.getRemoteValidation()).toEqual({
        issues: [
          {
            code: "invalid-resource-image-property",
            property: "alt",
          },
        ],
        status: "invalid",
      })

      image.setAttribute("__alt", "최종 대체 텍스트")

      expect(collaboration.getRemoteValidation()).toEqual({ status: "valid" })
      expect(validationChanges.map(({ status }) => status)).toEqual([
        "valid",
        "invalid",
        "valid",
        "invalid",
        "valid",
        "invalid",
        "valid",
      ])
    } finally {
      collaboration.disconnect()
      document.destroy()
    }
  })

  it.each([
    {
      attribute: "__tag",
      markdown: "# 제목",
      nodeType: "heading",
      value: "script",
    },
    {
      attribute: "__type",
      markdown: "# 제목",
      nodeType: "heading",
      value: "unknown-resource-node",
    },
    {
      attribute: "__tag",
      markdown: "- 항목",
      nodeType: "list",
      value: "script",
    },
    {
      attribute: "__url",
      markdown: "[링크](https://example.com)",
      nodeType: "link",
      value: "http://example.com",
    },
  ])(
    "원격 $nodeType의 허용되지 않은 $attribute 값을 화면 editor에서 격리한다",
    ({ attribute, markdown, nodeType, value }) => {
      const snapshotResult = createResourceDocumentSnapshot(markdown)

      if (snapshotResult.status !== "valid") {
        throw new Error("유효한 Markdown fixture가 거부되었습니다.")
      }

      const document = new Doc()
      const editor = createResourceDocumentEditor()

      applyUpdate(document, snapshotResult.snapshot)

      const collaboration = connectResourceDocumentCollaboration({
        document,
        editor,
        id: `resource-${nodeType}-validation`,
        onRemoteValidationChange: () => undefined,
        provider: createTestProvider(),
      })

      try {
        findYjsNodeByLexicalType(document, nodeType).setAttribute(
          attribute,
          value
        )

        expect(collaboration.getRemoteValidation().status).toBe("invalid")
        expect(readResourceDocumentMarkdown(editor)).toEqual(
          normalizeResourceMarkdown(markdown)
        )
      } finally {
        collaboration.disconnect()
        document.destroy()
      }
    }
  )

  it("화면 editor의 유효한 로컬 변경을 네트워크 Y.Doc으로 미러링한다", () => {
    const document = new Doc()
    const editor = createResourceDocumentEditor()
    const collaboration = connectResourceDocumentCollaboration({
      document,
      editor,
      id: "resource-local-mirror",
      onRemoteValidationChange: () => undefined,
      provider: createTestProvider(),
    })

    try {
      expect(replaceResourceDocumentMarkdown(editor, "# 로컬 변경")).toEqual({
        status: "valid",
      })
      expect(
        projectResourceDocumentSnapshot(encodeStateAsUpdate(document))
      ).toEqual(normalizeResourceMarkdown("# 로컬 변경"))
    } finally {
      collaboration.disconnect()
      document.destroy()
    }
  })

  it("원격 root type 변조를 화면 editor에서 격리한다", () => {
    const markdown = "본문"
    const snapshotResult = createResourceDocumentSnapshot(markdown)

    if (snapshotResult.status !== "valid") {
      throw new Error("유효한 Markdown fixture가 거부되었습니다.")
    }

    const document = new Doc()
    const editor = createResourceDocumentEditor()

    applyUpdate(document, snapshotResult.snapshot)

    const collaboration = connectResourceDocumentCollaboration({
      document,
      editor,
      id: "resource-root-type-validation",
      onRemoteValidationChange: () => undefined,
      provider: createTestProvider(),
    })

    try {
      document
        .get("root", XmlText)
        .setAttribute("__type", "unknown-resource-root")

      expect(collaboration.getRemoteValidation().status).toBe("invalid")
      expect(readResourceDocumentMarkdown(editor)).toEqual(
        normalizeResourceMarkdown(markdown)
      )
    } finally {
      collaboration.disconnect()
      document.destroy()
    }
  })

  it("원격 persisted NodeState를 화면 editor에 적용하기 전에 거부한다", () => {
    const probeState = createState("remote-probe", {
      parse: (value) => (typeof value === "string" ? value : ""),
    })
    const sourceDocument = new Doc()
    const source = createHeadlessResourceDocumentCollaboration({
      document: sourceDocument,
      id: "resource-node-state-source",
    })

    source.editor.update(
      () => {
        const text = $createTextNode("숨겨진 상태")

        $setState(text, probeState, "secret")
        $getRoot().append($createParagraphNode().append(text))
      },
      { discrete: true }
    )

    const document = new Doc()
    const editor = createResourceDocumentEditor()

    applyUpdate(document, encodeStateAsUpdate(sourceDocument))

    const collaboration = connectResourceDocumentCollaboration({
      document,
      editor,
      id: "resource-node-state-target",
      onRemoteValidationChange: () => undefined,
      provider: createTestProvider(),
    })

    try {
      expect(collaboration.getRemoteValidation()).toEqual({
        issues: [
          {
            code: "unsupported-node-state",
            keys: ["remote-probe"],
            nodeType: "text",
          },
        ],
        status: "invalid",
      })
      expect(readResourceDocumentMarkdown(editor)).toEqual({
        markdown: "",
        status: "valid",
      })
    } finally {
      collaboration.disconnect()
      source.disconnect()
      document.destroy()
      sourceDocument.destroy()
    }
  })
})

function appendToFirstTextNode(
  editor: ReturnType<
    typeof createHeadlessResourceDocumentCollaboration
  >["editor"],
  text: string
): void {
  editor.update(
    () => {
      const node = $getRoot().getFirstDescendant()

      if (!$isTextNode(node)) {
        throw new Error("fixture의 첫 번째 텍스트 노드를 찾지 못했습니다.")
      }

      node.spliceText(node.getTextContentSize(), 0, text)
    },
    { discrete: true }
  )
}

function appendParagraph(
  editor: ReturnType<
    typeof createHeadlessResourceDocumentCollaboration
  >["editor"],
  text: string
): void {
  editor.update(
    () => {
      $getRoot().append($createParagraphNode().append($createTextNode(text)))
    },
    { discrete: true }
  )
}

function findYjsNodeByLexicalType(
  document: Doc,
  lexicalType: string
): XmlElement | XmlText {
  const pending: (XmlElement | XmlText)[] = [document.get("root", XmlText)]

  while (pending.length > 0) {
    const node = pending.shift()

    if (node === undefined) {
      break
    }

    if (node.getAttribute("__type") === lexicalType) {
      return node
    }

    const children =
      node instanceof XmlText
        ? node
            .toDelta()
            .map((delta: { readonly insert?: unknown }) => delta.insert)
            .filter(isYjsAttributedNode)
        : node.toArray().filter(isYjsAttributedNode)

    pending.push(...children)
  }

  throw new Error(`${lexicalType} Yjs node를 찾지 못했습니다.`)
}

function isYjsAttributedNode(value: unknown): value is XmlElement | XmlText {
  return value instanceof XmlElement || value instanceof XmlText
}

function createTestProvider(): Provider {
  const emptyStates = new Map<number, UserState>()

  return {
    awareness: {
      getLocalState: () => null,
      getStates: () => emptyStates,
      off: () => undefined,
      on: () => undefined,
      setLocalState: () => undefined,
      setLocalStateField: () => undefined,
    },
    connect: () => undefined,
    disconnect: () => undefined,
    off: () => undefined,
    on: () => undefined,
  }
}
