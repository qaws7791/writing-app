import { describe, expect, it } from "vitest"

import {
  createCourseImageUrl,
  resolveCourseImage,
} from "@/entities/course/model/course-visual-assets"

describe("코스 visual asset", () => {
  it("visualKey 기준 로컬 썸네일 URL을 반환한다", () => {
    expect(createCourseImageUrl("basic-sentence-writing")).toBe(
      "/course-thumbnails/basic-sentence-writing.png"
    )
    expect(createCourseImageUrl("expression")).toBe(
      "/course-thumbnails/expression.png"
    )
  })

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
