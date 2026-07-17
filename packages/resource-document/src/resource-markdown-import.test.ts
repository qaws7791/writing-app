import { describe, expect, it } from "vitest"

import {
  prepareResourceMarkdownImport,
  readResourceMarkdownPlainText,
} from "#resource-document/resource-markdown"

describe("자료 Markdown 가져오기와 검색 텍스트", () => {
  it("첫 번째 H1의 서식을 일반 텍스트 제목으로 만들고 본문에서 제거한다", () => {
    expect(
      prepareResourceMarkdownImport(
        "소개 문단\n\n# **운영** [안내](https://example.com/guide)\n\n본문"
      )
    ).toEqual({
      headingTitle: "운영 안내",
      markdown: "소개 문단\n\n본문",
      status: "valid",
    })
  })

  it("H1이 없으면 제목을 만들지 않고 정규 Markdown을 유지한다", () => {
    expect(prepareResourceMarkdownImport("## 시작\n\n본문")).toEqual({
      headingTitle: null,
      markdown: "## 시작\n\n본문",
      status: "valid",
    })
  })

  it("빈 Markdown을 유효한 빈 문서로 정규화한다", () => {
    expect(prepareResourceMarkdownImport("")).toEqual({
      headingTitle: null,
      markdown: "",
      status: "valid",
    })
  })

  it("Markdown 문법을 제외하고 코드와 이미지 대체 텍스트를 포함한 검색 텍스트를 만든다", () => {
    const result = readResourceMarkdownPlainText(
      "## 안내\n\n[링크](https://example.com)와 `코드`\n\n![설명](https://example.com/image.png)\n\n```ts\nconst value = 1\n```"
    )

    expect(result).toEqual({
      status: "valid",
      text: "안내 링크 와 코드 설명 const value = 1",
    })
  })

  it("지원 범위를 벗어난 Markdown은 가져오기 전에 거부한다", () => {
    expect(
      prepareResourceMarkdownImport("#### 지원하지 않는 제목")
    ).toMatchObject({
      status: "invalid",
    })
  })

  it("지원 범위를 벗어난 Markdown은 검색 텍스트로 만들기 전에 거부한다", () => {
    expect(
      readResourceMarkdownPlainText("#### 지원하지 않는 제목")
    ).toMatchObject({
      status: "invalid",
    })
  })
})
