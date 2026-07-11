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
  $isTextNode,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  type LexicalEditor,
} from "lexical"
import { useEffect } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  readResourceDocumentMarkdown,
  replaceResourceDocumentMarkdown,
  resourceDocumentNodes,
  resourceMarkdownTransformers,
} from "@workspace/resource-document/resource-markdown"

import {
  ResourceDocumentEditor,
  ResourceDocumentEditorSurface,
} from "@/features/resources/editor/resource-document-editor"
import type { ResourceDocumentCollaborationConnector } from "@/features/resources/editor/resource-document-collaboration-client"
import { ResourceSlashMenuPlugin } from "@/features/resources/editor/resource-slash-menu-plugin"
import type { ResourceDocumentEditorApi } from "@/features/resources/resource-library-api"
import type { ResourceWorkspaceSync } from "@/features/resources/resource-workspace-sync"
import { ResourceWorkspaceSyncProvider } from "@/features/resources/resource-workspace-sync-context"
import type { AdminResourceActiveDocument } from "@/lib/api/admin-api"
import { readAdminApiBaseUrl } from "@/runtime-config"

const documentMarkdownFixture = "## 시작\n\n본문 **강조**"

const documentFixture: AdminResourceActiveDocument = {
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
  stateVersion: 0,
  status: "active",
  updatedAt: "2026-07-10T00:00:00.000Z",
  updatedBy: {
    email: "admin@example.com",
    id: "admin-1",
    name: "관리자",
  },
}

describe("자료 Lexical 편집기", () => {
  it("production 편집기는 작업 공간 HTTP 동기화 lease를 사용한다", async () => {
    const release = vi.fn()
    const attachDocument = vi.fn<ResourceWorkspaceSync["attachDocument"]>(
      ({ editor }) => {
        replaceResourceDocumentMarkdown(editor, documentMarkdownFixture)
        return {
          release,
          retry: vi.fn(async () => undefined),
          subscribe(listener) {
            listener({
              kind: "synchronized",
              message: "모든 변경 사항이 동기화됨",
            })
            return () => undefined
          },
        }
      }
    )
    const sync: ResourceWorkspaceSync = {
      attachDocument,
      checkActiveDocument: vi.fn(),
      dispose: vi.fn(),
      start: vi.fn(),
    }
    const { unmount } = render(
      <ResourceWorkspaceSyncProvider sync={sync}>
        <ResourceDocumentEditor
          apiBaseUrl={readAdminApiBaseUrl({
            ADMIN_API_BASE_URL: "https://admin-api.example.test",
          })}
          document={documentFixture}
        />
      </ResourceWorkspaceSyncProvider>
    )

    await waitFor(() => {
      expect(attachDocument).toHaveBeenCalledWith({
        documentId: "document-1",
        editor: expect.any(Object),
      })
    })
    expect(
      screen.getByRole("status", { name: "모든 변경 사항이 동기화됨" })
    ).toBeVisible()

    unmount()
    expect(release).toHaveBeenCalledTimes(1)
  })

  beforeEach(() => {
    installEditorDomGeometry()
  })

  it("저장된 GFM을 분할 화면 없이 편집 가능한 문서로 렌더링한다", () => {
    renderResourceEditor()

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

  it("공동 편집 연결 상태를 항상 표시하고 unmount 때 연결을 정리한다", async () => {
    const disconnect = vi.fn()
    const connector = createCollaborationConnector(disconnect)
    const { unmount } = renderResourceEditor(connector)

    expect(await screen.findByText("모든 변경 사항이 동기화됨")).toBeVisible()
    expect(connector).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "document-1",
      })
    )
    expect(connector).toHaveBeenCalledWith(
      expect.not.objectContaining({ serverUrl: expect.any(String) })
    )
    unmount()
    expect(disconnect).toHaveBeenCalledTimes(1)
  })

  it("동기화 오류에서 다시 연결하고 현재 Markdown을 복사한다", async () => {
    const user = userEvent.setup()
    const retry = vi.fn()
    const writeClipboardText = vi.fn(async () => undefined)
    const connector: ResourceDocumentCollaborationConnector = vi.fn(
      ({ editor, onSyncStateChange }) => {
        const result = replaceResourceDocumentMarkdown(
          editor,
          documentMarkdownFixture
        )

        if (result.status === "invalid") {
          throw new Error("공동 편집 fixture Markdown을 열지 못했습니다.")
        }

        onSyncStateChange({
          kind: "error",
          message: "공동 편집 상태 저장에 실패했습니다.",
        })
        return { disconnect: vi.fn(), retry }
      }
    )

    render(
      <ResourceDocumentEditorSurface
        api={createEditorApi()}
        connectCollaboration={connector}
        document={documentFixture}
        writeClipboardText={writeClipboardText}
      />
    )

    await user.click(
      await screen.findByRole("button", { name: "동기화 다시 시도" })
    )
    await user.click(screen.getByRole("button", { name: "현재 Markdown 복사" }))

    expect(retry).toHaveBeenCalledTimes(1)
    expect(writeClipboardText).toHaveBeenCalledWith(documentMarkdownFixture)
    expect(
      await screen.findByText("현재 Markdown을 클립보드에 복사했습니다.")
    ).toBeVisible()
  })

  it("키보드로 플로팅 도구의 굵게 서식을 적용한다", async () => {
    const user = userEvent.setup()
    let editor: LexicalEditor | null = null
    const connector: ResourceDocumentCollaborationConnector = vi.fn((input) => {
      editor = input.editor
      const result = replaceResourceDocumentMarkdown(
        input.editor,
        documentMarkdownFixture
      )

      if (result.status === "invalid") {
        throw new Error("공동 편집 fixture Markdown을 열지 못했습니다.")
      }

      input.onSyncStateChange({
        kind: "saved",
        message: "모든 변경 사항이 동기화됨",
      })
      return { disconnect: vi.fn(), retry: vi.fn() }
    })

    renderResourceEditor(connector)
    await waitFor(() => {
      expect(editor).not.toBeNull()
    })
    const activeEditor = requireEditor(editor)

    activeEditor.update(
      () => {
        const text = $getRoot().getFirstDescendant()

        if (!$isTextNode(text)) {
          throw new Error("서식을 적용할 텍스트를 찾지 못했습니다.")
        }

        text.select(0, 2)
      },
      { discrete: true }
    )
    const bold = await screen.findByRole("button", { name: "굵게" })

    bold.focus()
    await user.keyboard("{Enter}")

    expect(readResourceDocumentMarkdown(activeEditor)).toEqual({
      markdown: "## **시작**\n\n본문 **강조**",
      status: "valid",
    })
  })

  it.each([
    { kind: "connecting", message: "공동 편집 서버에 연결 중" },
    { kind: "syncing", message: "공동 편집 변경 사항 동기화 중" },
    { kind: "saved", message: "모든 변경 사항이 동기화됨" },
    { kind: "reconnecting", message: "연결이 끊겨 다시 연결하는 중" },
    { kind: "error", message: "공동 편집 상태 저장 오류" },
    { kind: "invalid", message: "지원하지 않는 원격 서식 차단" },
    { kind: "readonly", message: "휴지통 문서 읽기 전용" },
  ] as const)(
    "$kind 동기화 상태를 한국어 접근성 이름으로 표시한다",
    async (state) => {
      const connector: ResourceDocumentCollaborationConnector = vi.fn(
        ({ onSyncStateChange }) => {
          onSyncStateChange(state)
          return { disconnect: vi.fn(), retry: vi.fn() }
        }
      )

      renderResourceEditor(connector)

      const status = await screen.findByRole("status", {
        name: state.message,
      })

      expect(status).toBeVisible()
      expect(status).toHaveClass("min-h-5", "sm:w-64")
    }
  )
})

function createEditorApi(): ResourceDocumentEditorApi {
  return {
    exportResourceDocument:
      vi.fn<ResourceDocumentEditorApi["exportResourceDocument"]>(),
  }
}

function renderResourceEditor(
  connector = createCollaborationConnector()
): ReturnType<typeof render> {
  return render(
    <ResourceDocumentEditorSurface
      api={createEditorApi()}
      connectCollaboration={connector}
      document={documentFixture}
    />
  )
}

function createCollaborationConnector(
  disconnect = vi.fn()
): ResourceDocumentCollaborationConnector {
  return vi.fn(({ editor, onSyncStateChange }) => {
    const result = replaceResourceDocumentMarkdown(
      editor,
      documentMarkdownFixture
    )

    if (result.status === "invalid") {
      throw new Error("공동 편집 fixture Markdown을 열지 못했습니다.")
    }

    onSyncStateChange({
      kind: "saved",
      message: "모든 변경 사항이 동기화됨",
    })
    return { disconnect, retry: vi.fn() }
  })
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

function requireEditor(editor: LexicalEditor | null): LexicalEditor {
  if (editor === null) {
    throw new Error("Lexical 편집기를 준비하지 못했습니다.")
  }

  return editor
}

function insertEditorText(editor: LexicalEditor | null, text: string): void {
  if (editor === null) {
    throw new Error("Lexical 편집기를 준비하지 못했습니다.")
  }

  act(() => {
    editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, text)
  })
}
