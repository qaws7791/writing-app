import * as React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import "@/test/ui-overlay-mocks"
import { CurriculumMap } from "@/features/courses/course-editor/curriculum-map"

afterEach(() => {
  cleanup()
})

const singleChapterWithLessons = [
  {
    id: "chapter-1",
    label: "1",
    title: "문장 성분 익히기",
    sortOrder: 1,
    status: "active" as const,
    lessons: [
      {
        id: "version-lesson-1",
        lessonId: "lesson-1",
        title: "목적어 붙이기",
        description: "설명",
        sortOrder: 1,
        status: "active" as const,
      },
    ],
  },
]

const singleChapterWithTwoLessons = [
  {
    id: "chapter-1",
    label: "1",
    title: "문장 성분 익히기",
    sortOrder: 1,
    status: "active" as const,
    lessons: [
      {
        id: "version-lesson-1",
        lessonId: "lesson-1",
        title: "목적어 붙이기",
        description: "설명",
        sortOrder: 1,
        status: "active" as const,
      },
      {
        id: "version-lesson-2",
        lessonId: "lesson-2",
        title: "필수 성분 찾기",
        description: "설명",
        sortOrder: 2,
        status: "active" as const,
      },
    ],
  },
]

describe("CurriculumMap", () => {
  it("renders chapters and selected lesson in the curriculum map", () => {
    render(
      <CurriculumMap
        chapters={singleChapterWithLessons}
        selectedLessonId="lesson-1"
      />
    )

    expect(screen.getByText("문장 성분 익히기")).toBeTruthy()
    expect(screen.getByText("목적어 붙이기")).toBeTruthy()
    expect(screen.getByText("커리큘럼")).toBeTruthy()
    expect(screen.queryByText("활성")).toBeNull()
    expect(screen.queryByText("Curriculum")).toBeNull()
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
        chapters={singleChapterWithTwoLessons}
        onSelectLesson={onSelectLesson}
        selectedLessonId="lesson-1"
      />
    )

    await user.click(
      screen.getByRole("button", { name: "필수 성분 찾기 활성" })
    )

    expect(onSelectLesson).toHaveBeenCalledWith("lesson-2")
  })

  it("renders drag handle buttons for each lesson when not read-only", () => {
    render(
      <CurriculumMap
        chapters={singleChapterWithLessons}
        selectedLessonId="lesson-1"
      />
    )

    expect(
      screen.getByRole("button", { name: "목적어 붙이기 순서 변경" })
    ).toBeTruthy()
  })

  it("hides drag handles and editing controls when read-only", () => {
    render(
      <CurriculumMap
        chapters={singleChapterWithLessons}
        isReadOnly
        selectedLessonId="lesson-1"
      />
    )

    expect(
      screen.queryByRole("button", { name: "목적어 붙이기 순서 변경" })
    ).toBeNull()
    expect(
      screen.queryByRole("button", { name: "문장 성분 익히기 챕터 편집" })
    ).toBeNull()
    expect(
      screen.queryByRole("button", { name: "목적어 붙이기 메뉴" })
    ).toBeNull()
    expect(screen.queryByRole("button", { name: "챕터 추가" })).toBeNull()
  })

  it("renders add chapter and add lesson buttons", async () => {
    const user = userEvent.setup()
    const onAddChapter = vi.fn()
    const onAddLesson = vi.fn()

    render(
      <CurriculumMap
        chapters={singleChapterWithLessons}
        onAddChapter={onAddChapter}
        onAddLesson={onAddLesson}
        selectedLessonId="lesson-1"
      />
    )

    await user.click(screen.getByRole("button", { name: "챕터 추가" }))
    await user.click(
      screen.getByRole("button", { name: "문장 성분 익히기 레슨 추가" })
    )

    expect(onAddChapter).toHaveBeenCalled()
    expect(onAddLesson).toHaveBeenCalledWith("chapter-1")
  })

  it("opens chapter edit popover and updates chapter fields", async () => {
    const user = userEvent.setup()
    const onUpdateChapterField = vi.fn()

    render(
      <CurriculumMap
        chapters={singleChapterWithLessons}
        onUpdateChapterField={onUpdateChapterField}
        selectedLessonId="lesson-1"
      />
    )

    await user.click(
      screen.getByRole("button", { name: "문장 성분 익히기 챕터 편집" })
    )

    const labelInput = screen.getByLabelText("레이블")
    const titleInput = screen.getByLabelText("문장 성분 익히기 챕터 제목")
    expect(titleInput).toBeTruthy()

    fireEvent.change(labelInput, {
      target: { value: "1-1" },
    })
    fireEvent.change(titleInput, {
      target: { value: "문장 성분 익히기 수정" },
    })

    expect(onUpdateChapterField).toHaveBeenCalledWith(
      "chapter-1",
      "label",
      "1-1"
    )
    expect(onUpdateChapterField).toHaveBeenCalledWith(
      "chapter-1",
      "title",
      expect.stringContaining("수정")
    )
  })

  it("archives a chapter via the edit popover", async () => {
    const user = userEvent.setup()
    const onArchiveChapter = vi.fn()

    render(
      <CurriculumMap
        chapters={singleChapterWithLessons}
        onArchiveChapter={onArchiveChapter}
        selectedLessonId="lesson-1"
      />
    )

    await user.click(
      screen.getByRole("button", { name: "문장 성분 익히기 챕터 편집" })
    )
    await user.click(
      screen.getByRole("button", { name: "문장 성분 익히기 챕터 보관" })
    )

    expect(onArchiveChapter).toHaveBeenCalledWith("chapter-1")
  })

  it("archives a lesson via the lesson context menu", async () => {
    const user = userEvent.setup()
    const onArchiveLesson = vi.fn()

    render(
      <CurriculumMap
        chapters={singleChapterWithLessons}
        onArchiveLesson={onArchiveLesson}
        selectedLessonId="lesson-1"
      />
    )

    await user.click(screen.getByRole("button", { name: "목적어 붙이기 메뉴" }))
    await user.click(screen.getByText("레슨 보관"))

    expect(onArchiveLesson).toHaveBeenCalledWith("lesson-1")
  })

  it("collapses and expands a chapter when the toggle is clicked", async () => {
    const user = userEvent.setup()

    render(
      <CurriculumMap
        chapters={singleChapterWithLessons}
        selectedLessonId="lesson-1"
      />
    )

    expect(screen.getByText("목적어 붙이기")).toBeTruthy()

    await user.click(
      screen.getByRole("button", { name: "문장 성분 익히기 챕터 펼치기" })
    )

    expect(screen.queryByText("목적어 붙이기")).toBeNull()

    await user.click(
      screen.getByRole("button", { name: "문장 성분 익히기 챕터 펼치기" })
    )

    expect(screen.getByText("목적어 붙이기")).toBeTruthy()
  })

  it("renders an empty state when there are no chapters", () => {
    render(<CurriculumMap chapters={[]} selectedLessonId={null} />)

    expect(screen.getByText("챕터를 추가하세요")).toBeTruthy()
  })

  it("renders an empty state when a chapter has no lessons", () => {
    render(
      <CurriculumMap
        chapters={[
          {
            id: "chapter-1",
            label: "1",
            title: "문장 성분 익히기",
            sortOrder: 1,
            status: "active",
            lessons: [],
          },
        ]}
        selectedLessonId={null}
      />
    )

    expect(screen.getByText("이 챕터에 레슨을 추가하세요")).toBeTruthy()
    expect(
      screen.getByRole("button", { name: "문장 성분 익히기 레슨 추가" })
    ).toBeTruthy()
  })
})
