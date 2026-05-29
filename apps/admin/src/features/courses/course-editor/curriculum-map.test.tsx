import * as React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CurriculumMap } from "@/features/courses/course-editor/curriculum-map"

afterEach(() => {
  cleanup()
})

describe("CurriculumMap", () => {
  it("renders chapters and selected lesson in the curriculum map", () => {
    render(
      <CurriculumMap
        chapters={[
          {
            id: "chapter-1",
            label: "1",
            title: "문장 성분 익히기",
            sortOrder: 1,
            status: "active",
            lessons: [
              {
                id: "version-lesson-1",
                lessonId: "lesson-1",
                title: "목적어 붙이기",
                description: "설명",
                sortOrder: 1,
                status: "active",
              },
            ],
          },
        ]}
        selectedLessonId="lesson-1"
      />
    )

    expect(screen.getByDisplayValue("문장 성분 익히기")).toBeTruthy()
    expect(screen.getByText("목적어 붙이기")).toBeTruthy()
    expect(screen.getByText("커리큘럼")).toBeTruthy()
    expect(screen.getAllByText("활성").length).toBeGreaterThan(0)
    expect(screen.queryByText("Curriculum")).toBeNull()
    expect(screen.queryByText("active")).toBeNull()
    expect(screen.queryByText("1 lessons")).toBeNull()
    expect(
      screen
        .getByRole("button", { name: "목적어 붙이기 활성" })
        .getAttribute("aria-current")
    ).toBe("true")
  })

  it("selects a lesson when the lesson row is clicked", async () => {
    const user = userEvent.setup()
    const onSelectLesson = vi.fn()

    render(
      <CurriculumMap
        chapters={[
          {
            id: "chapter-1",
            label: "1",
            title: "문장 성분 익히기",
            sortOrder: 1,
            status: "active",
            lessons: [
              {
                id: "version-lesson-1",
                lessonId: "lesson-1",
                title: "목적어 붙이기",
                description: "설명",
                sortOrder: 1,
                status: "active",
              },
              {
                id: "version-lesson-2",
                lessonId: "lesson-2",
                title: "필수 성분 찾기",
                description: "설명",
                sortOrder: 2,
                status: "active",
              },
            ],
          },
        ]}
        onSelectLesson={onSelectLesson}
        selectedLessonId="lesson-1"
      />
    )

    await user.click(
      screen.getByRole("button", { name: "필수 성분 찾기 활성" })
    )

    expect(onSelectLesson).toHaveBeenCalledWith("lesson-2")
  })

  it("moves a lesson when the lesson move button is clicked", async () => {
    const user = userEvent.setup()
    const onMoveLesson = vi.fn()

    render(
      <CurriculumMap
        chapters={[
          {
            id: "chapter-1",
            label: "1",
            title: "문장 성분 익히기",
            sortOrder: 1,
            status: "active",
            lessons: [
              {
                id: "version-lesson-1",
                lessonId: "lesson-1",
                title: "목적어 붙이기",
                description: "설명",
                sortOrder: 1,
                status: "active",
              },
              {
                id: "version-lesson-2",
                lessonId: "lesson-2",
                title: "필수 성분 찾기",
                description: "설명",
                sortOrder: 2,
                status: "active",
              },
            ],
          },
        ]}
        onMoveLesson={onMoveLesson}
        selectedLessonId="lesson-1"
      />
    )

    await user.click(
      screen.getByRole("button", { name: "목적어 붙이기 아래로 이동" })
    )

    expect(onMoveLesson).toHaveBeenCalledWith("lesson-1", 1)
  })

  it("renders chapter and lesson editing controls", async () => {
    const user = userEvent.setup()
    const onAddChapter = vi.fn()
    const onAddLesson = vi.fn()
    const onArchiveChapter = vi.fn()
    const onArchiveLesson = vi.fn()
    const onUpdateChapterField = vi.fn()

    render(
      <CurriculumMap
        chapters={[
          {
            id: "chapter-1",
            label: "1",
            title: "문장 성분 익히기",
            sortOrder: 1,
            status: "active",
            lessons: [
              {
                id: "version-lesson-1",
                lessonId: "lesson-1",
                title: "목적어 붙이기",
                description: "설명",
                sortOrder: 1,
                status: "active",
              },
            ],
          },
        ]}
        onAddChapter={onAddChapter}
        onAddLesson={onAddLesson}
        onArchiveChapter={onArchiveChapter}
        onArchiveLesson={onArchiveLesson}
        onUpdateChapterField={onUpdateChapterField}
        selectedLessonId="lesson-1"
      />
    )

    await user.click(screen.getByRole("button", { name: "챕터 추가" }))
    fireEvent.change(screen.getByLabelText("문장 성분 익히기 챕터 제목"), {
      target: { value: "문장 성분 익히기 수정" },
    })
    await user.click(
      screen.getByRole("button", { name: "문장 성분 익히기 챕터 보관" })
    )
    await user.click(
      screen.getByRole("button", { name: "문장 성분 익히기 레슨 추가" })
    )
    await user.click(
      screen.getByRole("button", { name: "목적어 붙이기 레슨 보관" })
    )

    expect(onAddChapter).toHaveBeenCalled()
    expect(onAddLesson).toHaveBeenCalledWith("chapter-1")
    expect(onArchiveChapter).toHaveBeenCalledWith("chapter-1")
    expect(onArchiveLesson).toHaveBeenCalledWith("lesson-1")
    expect(onUpdateChapterField).toHaveBeenCalledWith(
      "chapter-1",
      "title",
      expect.stringContaining("수정")
    )
    expect(
      screen.getByRole("button", { name: "목적어 붙이기 순서 변경" })
    ).toBeTruthy()
  })
})
