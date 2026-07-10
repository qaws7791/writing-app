import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import {
  $createParagraphNode,
  $getRoot,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  type LexicalEditor,
} from "lexical"
import { useEffect } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  readResourceDocumentMarkdown,
  resourceDocumentNodes,
  resourceMarkdownTransformers,
} from "@workspace/resource-document/resource-markdown"

import { ResourceDocumentEditorSurface } from "@/features/resources/editor/resource-document-editor"
import { ResourceSlashMenuPlugin } from "@/features/resources/editor/resource-slash-menu-plugin"
import type { ResourceDocumentEditorApi } from "@/features/resources/resource-library-api"
import type { AdminResourceLibraryDocument } from "@/lib/api/admin-api"

const documentFixture: AdminResourceLibraryDocument = {
  contentMarkdown: "## 시작\n\n본문 **강조**",
  contentRevision: 0,
  createdAt: "2026-07-10T00:00:00.000Z",
  createdBy: {
    email: "admin@example.com",
    id: "admin-1",
    name: "관리자",
  },
  id: "document-1",
  name: "운영 안내",
  parentId: null,
  path: [],
  status: "active",
  updatedAt: "2026-07-10T00:00:00.000Z",
  updatedBy: {
    email: "admin@example.com",
    id: "admin-1",
    name: "관리자",
  },
}

describe("자료 Lexical 편집기", () => {
  beforeEach(() => {
    installEditorDomGeometry()
  })

  it("저장된 GFM을 분할 화면 없이 편집 가능한 문서로 렌더링한다", () => {
    render(
      <ResourceDocumentEditorSurface
        api={createEditorApi()}
        document={documentFixture}
      />
    )

    expect(
      screen.getByRole("heading", { level: 2, name: "시작" })
    ).toBeVisible()
    expect(screen.getByText("강조").tagName).toBe("STRONG")
    expect(screen.getByRole("textbox", { name: "자료 본문" })).toHaveAttribute(
      "contenteditable",
      "true"
    )
    expect(screen.queryByText("Markdown 미리보기")).not.toBeInTheDocument()
  })

  it("Markdown 단축키와 키보드 slash command로 블록을 만든다", async () => {
    const user = userEvent.setup()
    let editor: LexicalEditor | null = null
    const { container, unmount } = render(
      <CommandEditorFixture
        onEditor={(nextEditor) => {
          editor = nextEditor
        }}
      />
    )
    await waitFor(() => {
      expect(editor).not.toBeNull()
    })
    focusEditor(editor)
    insertEditorText(editor, "#")
    await waitFor(() => {
      expect(container.querySelector("[data-lexical-text]")).toHaveTextContent(
        "#"
      )
    })
    insertEditorText(editor, " ")
    await waitFor(() => {
      expect(container.querySelector("h1")).not.toBeNull()
    })
    insertEditorText(editor, "단축키 제목")

    expect(
      await screen.findByRole("heading", { level: 1, name: "단축키 제목" })
    ).toBeVisible()

    unmount()
    editor = null
    render(
      <CommandEditorFixture
        onEditor={(nextEditor) => {
          editor = nextEditor
        }}
      />
    )
    await waitFor(() => {
      expect(editor).not.toBeNull()
    })
    focusEditor(editor)
    insertEditorText(editor, "/제목 2")
    expect(
      await screen.findByRole("listbox", { name: "블록 종류" })
    ).toBeVisible()
    await user.keyboard("{Enter}")
    insertEditorText(editor, "슬래시 제목")

    expect(
      await screen.findByRole("heading", { level: 2, name: "슬래시 제목" })
    ).toBeVisible()
  })

  it("slash command 이미지는 HTTPS URL과 대체 텍스트를 검증한다", async () => {
    const user = userEvent.setup()
    let editor: LexicalEditor | null = null

    render(
      <CommandEditorFixture
        onEditor={(nextEditor) => {
          editor = nextEditor
        }}
      />
    )
    await waitFor(() => {
      expect(editor).not.toBeNull()
    })
    focusEditor(editor)
    insertEditorText(editor, "/이미지")
    await screen.findByRole("listbox", { name: "블록 종류" })
    await user.keyboard("{Enter}")
    await user.type(
      screen.getByLabelText("이미지 URL"),
      "http://example.com/a.png"
    )
    await user.type(screen.getByLabelText("대체 텍스트"), "운영 이미지")
    await user.click(screen.getByRole("button", { name: "삽입" }))

    expect(
      await screen.findByText("이미지는 HTTPS URL만 사용할 수 있습니다.")
    ).toBeVisible()

    await user.clear(screen.getByLabelText("이미지 URL"))
    await user.type(
      screen.getByLabelText("이미지 URL"),
      "https://example.com/a.png"
    )
    await user.click(screen.getByRole("button", { name: "삽입" }))

    expect(
      await screen.findByRole("img", { name: "운영 이미지" })
    ).toHaveAttribute("src", "https://example.com/a.png")
    if (editor === null) {
      throw new Error("Lexical 편집기를 준비하지 못했습니다.")
    }
    expect(readResourceDocumentMarkdown(editor)).toEqual({
      markdown: "![운영 이미지](https://example.com/a.png)",
      status: "valid",
    })
  })

  it("slash command 표를 빈 문단 없이 유효한 GFM으로 만든다", async () => {
    const user = userEvent.setup()
    let editor: LexicalEditor | null = null

    render(
      <CommandEditorFixture
        onEditor={(nextEditor) => {
          editor = nextEditor
        }}
      />
    )
    await waitFor(() => {
      expect(editor).not.toBeNull()
    })
    focusEditor(editor)
    insertEditorText(editor, "/표")
    await screen.findByRole("listbox", { name: "블록 종류" })
    await user.keyboard("{Enter}")
    await user.clear(screen.getByLabelText("행"))
    await user.type(screen.getByLabelText("행"), "2")
    await user.clear(screen.getByLabelText("열"))
    await user.type(screen.getByLabelText("열"), "2")
    await user.click(screen.getByRole("button", { name: "삽입" }))

    expect(await screen.findByRole("table")).toBeVisible()
    if (editor === null) {
      throw new Error("Lexical 편집기를 준비하지 못했습니다.")
    }
    const projection = readResourceDocumentMarkdown(editor)

    expect(projection.status).toBe("valid")
    if (projection.status === "valid") {
      expect(projection.markdown).toContain("| - | - |")
    }
  })

  it("코드 블록 안에서는 블록 slash command를 열지 않는다", async () => {
    const user = userEvent.setup()
    let editor: LexicalEditor | null = null

    render(
      <CommandEditorFixture
        onEditor={(nextEditor) => {
          editor = nextEditor
        }}
      />
    )
    await waitFor(() => {
      expect(editor).not.toBeNull()
    })
    focusEditor(editor)
    insertEditorText(editor, "/코드 블록")
    await screen.findByRole("listbox", { name: "블록 종류" })
    await user.keyboard("{Enter}")
    insertEditorText(editor, "/이미지")

    expect(
      screen.queryByRole("listbox", { name: "블록 종류" })
    ).not.toBeInTheDocument()
  })

  it("본문 변경을 content revision과 함께 자동 저장한다", async () => {
    const user = userEvent.setup()
    const api = createEditorApi()
    vi.mocked(api.saveResourceLibraryDocument).mockImplementation(
      async (_documentId, input) => ({
        status: "ok",
        value: {
          ...documentFixture,
          contentMarkdown: input.markdown,
          contentRevision: 1,
          updatedAt: "2026-07-10T01:00:00.000Z",
        },
      })
    )

    render(
      <ResourceDocumentEditorSurface api={api} document={documentFixture} />
    )
    const editor = screen.getByRole("textbox", { name: "자료 본문" })

    await user.click(editor)
    await user.type(editor, " 갱신")

    await waitFor(
      () => {
        expect(api.saveResourceLibraryDocument).toHaveBeenCalledWith(
          "document-1",
          expect.objectContaining({
            expectedContentRevision: 0,
            markdown: expect.stringContaining("갱신"),
          })
        )
      },
      { timeout: 2_000 }
    )
    expect(await screen.findByText("모든 변경 사항이 저장됨")).toBeVisible()
  })

  it("여러 블록을 선택한 서식을 유효한 GFM으로 자동 저장한다", async () => {
    const user = userEvent.setup()
    const api = createEditorApi()
    vi.mocked(api.saveResourceLibraryDocument).mockImplementation(
      async (_documentId, input) => ({
        status: "ok",
        value: {
          ...documentFixture,
          contentMarkdown: input.markdown,
          contentRevision: 1,
        },
      })
    )

    render(
      <ResourceDocumentEditorSurface api={api} document={documentFixture} />
    )
    const editor = screen.getByRole("textbox", { name: "자료 본문" })

    await user.click(editor)
    await user.keyboard("{Control>}a{/Control}")
    await user.click(screen.getByRole("button", { name: "굵게" }))

    await waitFor(
      () => {
        expect(api.saveResourceLibraryDocument).toHaveBeenCalledWith(
          "document-1",
          {
            expectedContentRevision: 0,
            markdown: "## **시작**\n\n**본문 강조**",
          }
        )
      },
      { timeout: 2_000 }
    )
  })

  it("저장 중 발생한 편집은 병렬 요청 없이 다음 content revision으로 이어서 저장한다", async () => {
    const user = userEvent.setup()
    const api = createEditorApi()
    type SaveResult = Awaited<
      ReturnType<ResourceDocumentEditorApi["saveResourceLibraryDocument"]>
    >
    const firstSave = createDeferred<SaveResult>()

    vi.mocked(api.saveResourceLibraryDocument)
      .mockImplementationOnce(() => firstSave.promise)
      .mockImplementationOnce(async (_documentId, input) => ({
        status: "ok",
        value: {
          ...documentFixture,
          contentMarkdown: input.markdown,
          contentRevision: 2,
        },
      }))

    render(
      <ResourceDocumentEditorSurface api={api} document={documentFixture} />
    )
    const editor = screen.getByRole("textbox", { name: "자료 본문" })

    await user.click(editor)
    await user.type(editor, " 첫째")
    await waitFor(
      () => {
        expect(api.saveResourceLibraryDocument).toHaveBeenCalledTimes(1)
      },
      { timeout: 2_000 }
    )
    await user.type(editor, " 둘째")
    expect(api.saveResourceLibraryDocument).toHaveBeenCalledTimes(1)

    const firstMarkdown = vi.mocked(api.saveResourceLibraryDocument).mock
      .calls[0]?.[1].markdown

    if (firstMarkdown === undefined) {
      throw new Error("첫 번째 자동 저장 Markdown을 찾지 못했습니다.")
    }

    act(() => {
      firstSave.resolve({
        status: "ok",
        value: {
          ...documentFixture,
          contentMarkdown: firstMarkdown,
          contentRevision: 1,
        },
      })
    })

    await waitFor(
      () => {
        expect(api.saveResourceLibraryDocument).toHaveBeenCalledTimes(2)
      },
      { timeout: 2_000 }
    )
    expect(api.saveResourceLibraryDocument).toHaveBeenLastCalledWith(
      "document-1",
      expect.objectContaining({
        expectedContentRevision: 1,
        markdown: expect.stringContaining("둘째"),
      })
    )
  })
})

function createEditorApi(): ResourceDocumentEditorApi {
  return {
    exportResourceDocument:
      vi.fn<ResourceDocumentEditorApi["exportResourceDocument"]>(),
    saveResourceLibraryDocument:
      vi.fn<ResourceDocumentEditorApi["saveResourceLibraryDocument"]>(),
  }
}

function createDeferred<TValue>(): {
  readonly promise: Promise<TValue>
  readonly resolve: (value: TValue) => void
} {
  let settle: ((value: TValue) => void) | undefined
  const promise = new Promise<TValue>((resolve) => {
    settle = resolve
  })

  return {
    promise,
    resolve(value) {
      if (settle === undefined) {
        throw new Error("비동기 테스트 요청을 준비하지 못했습니다.")
      }

      settle(value)
    },
  }
}

function installEditorDomGeometry(): void {
  const rectangle = {
    bottom: 40,
    height: 20,
    left: 10,
    right: 210,
    top: 20,
    width: 200,
    x: 10,
    y: 20,
    toJSON: () => ({}),
  } as DOMRect

  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => rectangle,
  })
  Object.defineProperty(Range.prototype, "getClientRects", {
    configurable: true,
    value: () => ({
      0: rectangle,
      item: () => rectangle,
      length: 1,
      [Symbol.iterator]: () => [rectangle][Symbol.iterator](),
    }),
  })
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserverMock {
      disconnect(): void {}
      observe(): void {}
      unobserve(): void {}
    }
  )
}

function CommandEditorFixture({
  onEditor,
}: {
  readonly onEditor: (editor: LexicalEditor) => void
}) {
  return (
    <LexicalComposer
      initialConfig={{
        editorState: () => {
          $getRoot().append($createParagraphNode())
        },
        namespace: "resource-command-test",
        nodes: [...resourceDocumentNodes],
        onError: (error) => {
          throw error
        },
      }}
    >
      <RichTextPlugin
        contentEditable={<ContentEditable aria-label="명령 편집기" />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <MarkdownShortcutPlugin
        transformers={[...resourceMarkdownTransformers]}
      />
      <ResourceSlashMenuPlugin />
      <EditorBridge onEditor={onEditor} />
    </LexicalComposer>
  )
}

function EditorBridge({
  onEditor,
}: {
  readonly onEditor: (editor: LexicalEditor) => void
}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    onEditor(editor)
  }, [editor, onEditor])

  return null
}

function focusEditor(editor: LexicalEditor | null): void {
  if (editor === null) {
    throw new Error("Lexical 편집기를 준비하지 못했습니다.")
  }

  const root = editor.getRootElement()

  if (root === null) {
    throw new Error("Lexical 편집기 DOM을 준비하지 못했습니다.")
  }

  root.focus()
  act(() => {
    editor.update(
      () => {
        $getRoot().getFirstChild()?.selectEnd()
      },
      { discrete: true }
    )
  })
}

function insertEditorText(editor: LexicalEditor | null, text: string): void {
  if (editor === null) {
    throw new Error("Lexical 편집기를 준비하지 못했습니다.")
  }

  act(() => {
    editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, text)
  })
}
