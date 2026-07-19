import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical"
import { useState } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { resourceDocumentNodes } from "@workspace/resource-document/resource-markdown"

import { ResourceDraggableBlockPlugin } from "@/features/resource-document-editor/ui/resource-draggable-block-plugin"
import { ResourceSlashMenuPlugin } from "@/features/resource-document-editor/ui/resource-slash-menu-plugin"

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

beforeEach(() => {
  const rectangle = createRectangle(0, 20, 200)

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
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: class ResizeObserverMock {
      disconnect(): void {}
      observe(): void {}
      unobserve(): void {}
    },
  })
})

describe("자료 편집기 블록 드래그 계약", () => {
  it("공식 experimental plugin으로 블록을 실제 드래그해 순서를 바꾼다", async () => {
    vi.stubGlobal("DragEvent", MouseEvent)
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function getBoundingClientRect(this: HTMLElement) {
        if (this.textContent === "첫째 블록") {
          return createRectangle(0, 30)
        }

        if (this.textContent === "둘째 블록") {
          return createRectangle(40, 70)
        }

        return createRectangle(0, 100, 500)
      }
    )

    const { container } = render(<EditorFixture />)
    const anchor = await screen.findByTestId("resource-editor-anchor")
    const firstBlock = screen.getByText("첫째 블록")

    fireEvent.mouseMove(anchor.parentElement ?? anchor, {
      clientX: 100,
      clientY: 10,
    })

    const handle = await screen.findByRole("button", { name: "블록 이동" })
    const draggable = handle.closest('[draggable="true"]')

    if (draggable === null) {
      throw new Error("공식 plugin의 draggable wrapper를 찾지 못했습니다.")
    }

    expect(draggable).toHaveAttribute("draggable", "true")

    const transfer = createDataTransfer()

    fireEvent.dragStart(draggable, { dataTransfer: transfer })
    const secondBlock = screen.getByText("둘째 블록")

    fireEvent.dragOver(secondBlock, {
      clientY: 65,
      dataTransfer: transfer,
    })
    fireEvent.drop(secondBlock, { clientY: 65, dataTransfer: transfer })

    await waitFor(() => {
      const blocks = [...container.querySelectorAll("p")].map(
        (element) => element.textContent
      )

      expect(blocks).toEqual(["둘째 블록", "첫째 블록"])
    })

    expect(firstBlock).toBeInTheDocument()
  })

  it("키보드 단축키로 현재 블록을 아래로 이동한다", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function getBoundingClientRect(this: HTMLElement) {
        if (this.textContent === "첫째 블록") return createRectangle(0, 30)
        if (this.textContent === "둘째 블록") return createRectangle(40, 70)
        return createRectangle(0, 100, 500)
      }
    )

    const { container } = render(<EditorFixture />)
    const anchor = await screen.findByTestId("resource-editor-anchor")

    fireEvent.mouseMove(anchor.parentElement ?? anchor, {
      clientX: 100,
      clientY: 10,
    })
    const handle = await screen.findByRole("button", { name: "블록 이동" })

    handle.focus()
    fireEvent.keyDown(handle, { altKey: true, key: "ArrowDown" })

    await waitFor(() => {
      expect(
        [...container.querySelectorAll("p")].map(
          (element) => element.textContent
        )
      ).toEqual(["둘째 블록", "첫째 블록"])
    })
    expect(handle).toHaveAttribute(
      "aria-keyshortcuts",
      "Alt+ArrowUp Alt+ArrowDown"
    )
  })

  it("새 블록 추가 버튼으로 다음 문단의 slash menu를 연다", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function getBoundingClientRect(this: HTMLElement) {
        if (this.textContent === "첫째 블록") return createRectangle(0, 30)
        if (this.textContent === "둘째 블록") return createRectangle(40, 70)
        return createRectangle(0, 100, 500)
      }
    )

    render(<EditorFixture />)
    const anchor = await screen.findByTestId("resource-editor-anchor")

    fireEvent.mouseMove(anchor.parentElement ?? anchor, {
      clientX: 100,
      clientY: 10,
    })
    fireEvent.click(await screen.findByRole("button", { name: "새 블록 추가" }))

    expect(
      await screen.findByRole("listbox", { name: "블록 종류" })
    ).toBeVisible()
  })
})

function EditorFixture() {
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(
    null
  )

  return (
    <LexicalComposer
      initialConfig={{
        editorState: () => {
          $getRoot().append(
            $createParagraphNode().append($createTextNode("첫째 블록")),
            $createParagraphNode().append($createTextNode("둘째 블록"))
          )
        },
        namespace: "resource-draggable-block-test",
        nodes: [...resourceDocumentNodes],
        onError: (error) => {
          throw error
        },
      }}
    >
      <div>
        <div ref={setAnchorElement} data-testid="resource-editor-anchor">
          <RichTextPlugin
            contentEditable={<ContentEditable aria-label="자료 본문" />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          {anchorElement === null ? null : (
            <ResourceDraggableBlockPlugin anchorElement={anchorElement} />
          )}
          <ResourceSlashMenuPlugin />
        </div>
      </div>
    </LexicalComposer>
  )
}

function createRectangle(top: number, bottom: number, width = 400): DOMRect {
  return {
    bottom,
    height: bottom - top,
    left: 0,
    right: width,
    top,
    width,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }
}

function createDataTransfer(): DataTransfer {
  const values = new Map<string, string>()

  return {
    clearData: (format) => {
      if (format === undefined) {
        values.clear()
        return
      }

      values.delete(format)
    },
    dropEffect: "move",
    effectAllowed: "all",
    files: createFileList(),
    getData: (format) => values.get(format) ?? "",
    items: createDataTransferItemList(),
    setData: (format, data) => {
      values.set(format, data)
    },
    setDragImage: () => undefined,
    types: [],
  }
}

function createFileList(): FileList {
  return {
    item: () => null,
    length: 0,
    [Symbol.iterator]: () => [][Symbol.iterator](),
  }
}

function createDataTransferItemList(): DataTransferItemList {
  return {
    add: () => null,
    clear: () => undefined,
    length: 0,
    remove: () => undefined,
    [Symbol.iterator]: () => [][Symbol.iterator](),
  }
}
