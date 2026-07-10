// @vitest-environment jsdom

import { describe, expect, it } from "vitest"
import { $getRoot, createEditor } from "lexical"

import { ResourceImageNode } from "#resource-document/resource-image-node"

describe("자료 이미지 DOM 경계", () => {
  it("허용되지 않은 URL을 DOM src에 반영하기 전에 거부한다", () => {
    const editor = createEditor({
      namespace: "resource-image-dom-boundary",
      nodes: [ResourceImageNode],
      onError: (error) => {
        throw error
      },
    })
    const rootElement = document.createElement("div")

    document.body.append(rootElement)
    editor.setRootElement(rootElement)

    try {
      expect(() =>
        editor.update(
          () => {
            $getRoot().append(
              new ResourceImageNode(
                "http://images.example.com/unsafe.png",
                "대체 텍스트"
              )
            )
          },
          { discrete: true }
        )
      ).toThrow("자료 이미지는 HTTPS URL만 사용할 수 있습니다.")
      expect(rootElement.querySelector("img")).toBeNull()
    } finally {
      editor.setRootElement(null)
      rootElement.remove()
    }
  })
})
