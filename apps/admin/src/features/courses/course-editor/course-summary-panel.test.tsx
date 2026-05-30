import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import * as React from "react"
import { afterEach, describe, expect, it } from "vitest"

import { CourseSummaryPanel } from "@/features/courses/course-editor/course-summary-panel"

afterEach(() => {
  cleanup()
})

describe("CourseSummaryPanel", () => {
  it("renders editable course summary without thumbnail controls or count cards", () => {
    render(
      <CourseSummaryPanel
        course={{
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description: "문장 성분을 익힙니다.",
          sortOrder: 1,
        }}
      />
    )

    expect(screen.getByLabelText("코스 제목")).toBeTruthy()
    expect(screen.getByLabelText("코스 설명")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "썸네일 변경" })).toBeNull()
    expect(screen.queryByLabelText("썸네일 파일")).toBeNull()
    expect(screen.queryByLabelText("썸네일 경로")).toBeNull()
    expect(screen.queryByText("챕터")).toBeNull()
    expect(screen.queryByText("레슨")).toBeNull()
    expect(screen.queryByText("스텝")).toBeNull()
  })

  it("updates course title and description", () => {
    const changes: Array<[string, string]> = []

    render(
      <CourseSummaryPanel
        course={{
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description: "문장 성분을 익힙니다.",
          sortOrder: 1,
        }}
        onUpdateCourseField={(field, value) => changes.push([field, value])}
      />
    )

    fireEvent.change(screen.getByLabelText("코스 제목"), {
      target: { value: "새 제목" },
    })
    fireEvent.change(screen.getByLabelText("코스 설명"), {
      target: { value: "새 설명" },
    })

    expect(changes).toContainEqual(["title", "새 제목"])
    expect(changes).toContainEqual(["description", "새 설명"])
  })
})
