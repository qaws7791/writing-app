import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical"
import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ResourceDraggableBlockPlugin } from "@/features/resources/editor/resource-draggable-block-plugin"

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
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
    const draggable = handle.parentElement

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
