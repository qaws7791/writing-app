import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CourseSummaryPanel } from "@/features/courses/course-editor/course-summary-panel"

afterEach(() => {
  cleanup()
})

describe("CourseSummaryPanel", () => {
  it("renders editable course summary without direct thumbnail path or count cards", () => {
    render(
      <CourseSummaryPanel
        course={{
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description: "문장 성분을 익힙니다.",
          thumbnailPath: "/course-thumbnails/sentence-structure.png",
          sortOrder: 1,
        }}
      />
    )

    expect(screen.getByLabelText("코스 제목")).toBeTruthy()
    expect(screen.getByLabelText("코스 설명")).toBeTruthy()
    expect(screen.getByRole("button", { name: "썸네일 변경" })).toBeTruthy()
    expect(screen.queryByLabelText("썸네일 경로")).toBeNull()
    expect(screen.queryByText("챕터")).toBeNull()
    expect(screen.queryByText("레슨")).toBeNull()
    expect(screen.queryByText("스텝")).toBeNull()
  })

  it("calls thumbnail file selection when an image is chosen", async () => {
    const user = userEvent.setup()
    const onSelectThumbnailFile = vi.fn()

    render(
      <CourseSummaryPanel
        course={{
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description: "문장 성분을 익힙니다.",
          thumbnailPath: "/course-thumbnails/sentence-structure.png",
          sortOrder: 1,
        }}
        onSelectThumbnailFile={onSelectThumbnailFile}
      />
    )

    const file = new File(["image"], "thumbnail.png", { type: "image/png" })
    await user.upload(screen.getByLabelText("썸네일 파일"), file)

    expect(onSelectThumbnailFile).toHaveBeenCalledWith(file)
  })

  it("disables thumbnail file selection while read-only", () => {
    render(
      <CourseSummaryPanel
        course={{
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description: "문장 성분을 익힙니다.",
          thumbnailPath: "/course-thumbnails/sentence-structure.png",
          sortOrder: 1,
        }}
        isReadOnly
      />
    )

    expect(
      (screen.getByLabelText("썸네일 파일") as HTMLInputElement).disabled
    ).toBe(true)
    expect(
      (
        screen.getByRole("button", {
          name: "썸네일 변경",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
  })
})
