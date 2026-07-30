import { describe, expect, it } from "vitest"

import { resolveCourseImage } from "@/entities/course/model/course-visual-assets"

describe("코스 visual asset", () => {
  it("발행 cover가 있으면 canonical URL과 대체 텍스트를 우선한다", () => {
    expect(
      resolveCourseImage({
        cover: {
          altText: "문장 쓰기 코스 표지",
          url: "https://assets.example.test/cover.webp",
        },
        title: "문장 쓰기",
        visualKey: "basic-sentence-writing",
      })
    ).toEqual({
      alt: "문장 쓰기 코스 표지",
      src: "https://assets.example.test/cover.webp",
    })
  })
})
