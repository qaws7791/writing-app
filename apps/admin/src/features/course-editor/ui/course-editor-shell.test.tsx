// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { adminCourseEditorSchema } from "@/features/course-editor/model/admin-course-editor"

import { CourseEditorShell } from "@/features/course-editor/ui/course-editor-shell"
import type { AdminCourseDetail } from "@/features/course-editor/model/admin-course-editor"
import {
  createAdminCourseEditorFixture,
  emptyAssetsResult,
} from "@/features/course-editor/test/fixtures/admin-course-editor"

const { routerPushMock } = vi.hoisted(() => ({
  routerPushMock: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}))

const course: AdminCourseDetail = adminCourseEditorSchema.parse({
  ...createAdminCourseEditorFixture({
    category: "언어와 읽기",
    curriculumVersionId: "c1-v3",
    description: "글쓰기 입문 과정",
    editVersion: 2,
    id: "c1",
    revision: 3,
    title: "글쓰기 첫걸음 30일",
  }),
  units: [
    {
      id: "u1",
      lessons: [
        {
          category: "기초",
          description: "문장을 시작합니다.",
          estimatedMinutes: 7,
          id: "l1",
          sortOrder: 1,
          status: "active",
          summary: ["좋은 문장은 모호하지 않다"],
          steps: [],
          title: "첫 레슨",
        },
      ],
      sortOrder: 1,
      status: "active",
      title: "1주차",
    },
  ],
})

const uploadAssetMock = vi.fn()

describe("CourseEditorShell", () => {
  it("표지의 대체 텍스트와 업로드 진행을 표시하고 asset ID를 저장한다", async () => {
    const user = userEvent.setup()
    const saveCourse = vi.fn(async (draft: AdminCourseDetail) => ({
      status: "ok" as const,
      value: { ...draft, editVersion: draft.editVersion + 1 },
    }))
    let finishUpload:
      | ((
          value: Readonly<{
            status: "ok"
            value: AdminCourseDetail["assets"][number]
          }>
        ) => void)
      | undefined
    uploadAssetMock.mockReturnValue(
      new Promise((resolve) => {
        finishUpload = resolve
      })
    )

    render(
      <CourseEditorShell
        assetsResult={emptyAssetsResult}
        course={course}
        publishCourse={async (draft) => ({ status: "ok", value: draft })}
        saveCourse={saveCourse}
        uploadAdminContentAsset={uploadAssetMock}
      />
    )

    await user.upload(
      screen.getByLabelText("이미지 파일"),
      new File(["cover"], "cover.png", { type: "image/png" })
    )
    await user.type(screen.getByLabelText("대체 텍스트"), "글쓰기 코스 표지")
    await user.click(screen.getByRole("button", { name: "이미지 업로드" }))

    expect(
      screen.getByRole("progressbar", { name: "코스 표지 업로드 진행 중" })
    ).toBeVisible()

    finishUpload?.({
      status: "ok",
      value: {
        altText: "글쓰기 코스 표지",
        byteSize: 1024,
        contentType: "image/webp",
        courseId: course.id,
        curriculumVersionId: course.curriculumVersionId,
        id: "asset-cover-1",
        kind: "course-cover",
        url: "https://assets.example.test/cover.webp",
      },
    })

    expect(
      await screen.findByRole("img", { name: "글쓰기 코스 표지" })
    ).toBeVisible()
    await user.click(screen.getByRole("button", { name: "변경 저장" }))
    await waitFor(() =>
      expect(saveCourse).toHaveBeenCalledWith(
        expect.objectContaining({
          coverAssetId: "asset-cover-1",
        })
      )
    )
  })

  it("저장된 draft를 확인 뒤 발행하고 action이 반환한 다음 draft를 반영한다", async () => {
    const user = userEvent.setup()
    const nextDraft = {
      ...course,
      curriculumVersionId: "c1-v4",
      editVersion: 0,
      revision: 4,
    }
    const publishCourse = vi.fn(async () => ({
      status: "ok" as const,
      value: nextDraft,
    }))

    render(
      <CourseEditorShell
        assetsResult={emptyAssetsResult}
        course={course}
        publishCourse={publishCourse}
        saveCourse={async (draft) => ({ status: "ok", value: draft })}
        uploadAdminContentAsset={uploadAssetMock}
      />
    )

    await user.click(screen.getByRole("button", { name: "초안 발행" }))
    const dialog = screen.getByRole("alertdialog", {
      name: "현재 초안을 발행할까요?",
    })
    expect(publishCourse).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole("button", { name: "발행하기" }))

    expect(publishCourse).toHaveBeenCalledWith(course)
    expect(await screen.findByText("리비전 3을 발행했습니다.")).toBeVisible()
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "글쓰기 첫걸음 30일" })
      ).toHaveFocus()
    )
  })

  it("저장하지 않은 변경이 있으면 탭 이동 확인을 취소해 현재 탭에 머문다", async () => {
    const user = userEvent.setup()

    renderCourseEditor()
    await user.type(screen.getByLabelText("제목"), " 수정")
    await user.click(screen.getByRole("button", { name: "커리큘럼" }))
    await user.click(
      within(readTabMoveDialog()).getByRole("button", { name: "취소" })
    )

    expect(screen.getByLabelText("제목")).toBeVisible()
  })

  it("저장하지 않은 변경이 있어도 탭 이동을 확인하면 커리큘럼 탭으로 이동한다", async () => {
    const user = userEvent.setup()

    renderCourseEditor()
    await user.type(screen.getByLabelText("제목"), " 수정")
    await user.click(screen.getByRole("button", { name: "커리큘럼" }))
    await user.click(
      within(readTabMoveDialog()).getByRole("button", { name: "이동하기" })
    )

    expect(screen.getByText("유닛 1개 · 레슨 1개")).toBeVisible()
  })

  it("저장하지 않은 변경이 있을 때 브라우저 이탈을 경고한다", async () => {
    const user = userEvent.setup()

    renderCourseEditor()

    const cleanEvent = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(cleanEvent)
    expect(cleanEvent.defaultPrevented).toBe(false)

    await user.type(screen.getByLabelText("제목"), " 수정")

    const dirtyEvent = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(dirtyEvent)
    expect(dirtyEvent.defaultPrevented).toBe(true)
  })

  it("저장하지 않은 변경이 있으면 목록 이동 확인을 취소해 이동하지 않는다", async () => {
    const user = userEvent.setup()

    renderCourseEditor()
    await user.type(screen.getByLabelText("제목"), " 수정")
    await user.click(screen.getByRole("link", { name: "콘텐츠 관리" }))
    await user.click(
      within(readCourseListMoveDialog()).getByRole("button", { name: "취소" })
    )

    expect(routerPushMock).not.toHaveBeenCalled()
  })

  it("저장하지 않은 변경이 있어도 목록 이동을 확인하면 코스 목록으로 이동한다", async () => {
    const user = userEvent.setup()

    renderCourseEditor()
    await user.type(screen.getByLabelText("제목"), " 수정")
    await user.click(screen.getByRole("link", { name: "콘텐츠 관리" }))
    await user.click(
      within(readCourseListMoveDialog()).getByRole("button", {
        name: "목록으로 이동",
      })
    )

    expect(routerPushMock).toHaveBeenCalledWith("/courses")
  })

  it("레슨 삭제 확인을 취소하면 레슨을 남긴다", async () => {
    const user = userEvent.setup()

    await openCurriculumTab(user)
    await user.click(screen.getByRole("button", { name: "첫 레슨 레슨 삭제" }))
    await user.click(
      within(readLessonRemoveDialog()).getByRole("button", { name: "취소" })
    )

    expect(screen.getByDisplayValue("첫 레슨")).toBeVisible()
  })

  it("레슨 삭제를 확인하면 레슨을 지우고 편집 제목으로 focus를 되돌린다", async () => {
    const user = userEvent.setup()

    await openCurriculumTab(user)
    await user.click(screen.getByRole("button", { name: "첫 레슨 레슨 삭제" }))
    await user.click(
      within(readLessonRemoveDialog()).getByRole("button", {
        name: "레슨 삭제",
      })
    )

    expect(screen.queryByDisplayValue("첫 레슨")).not.toBeInTheDocument()
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "글쓰기 첫걸음 30일" })
      ).toHaveFocus()
    )
  })

  it("유닛 삭제 확인을 취소하면 유닛을 남긴다", async () => {
    const user = userEvent.setup()

    await openCurriculumTab(user)
    await user.click(screen.getByRole("button", { name: "1주차 유닛 삭제" }))
    await user.click(
      within(readUnitRemoveDialog()).getByRole("button", { name: "취소" })
    )

    expect(screen.getByDisplayValue("1주차")).toBeVisible()
  })

  it("유닛 삭제를 확인하면 유닛을 지운다", async () => {
    const user = userEvent.setup()

    await openCurriculumTab(user)
    await user.click(screen.getByRole("button", { name: "1주차 유닛 삭제" }))
    await user.click(
      within(readUnitRemoveDialog()).getByRole("button", { name: "유닛 삭제" })
    )

    expect(screen.queryByDisplayValue("1주차")).not.toBeInTheDocument()
  })
})

async function openCurriculumTab(
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  renderCourseEditor()
  await user.click(screen.getByRole("button", { name: "커리큘럼" }))
}

function readTabMoveDialog(): HTMLElement {
  return screen.getByRole("alertdialog", { name: "편집 화면을 이동할까요?" })
}

function readCourseListMoveDialog(): HTMLElement {
  return screen.getByRole("alertdialog", { name: "콘텐츠 관리로 이동할까요?" })
}

function readLessonRemoveDialog(): HTMLElement {
  return screen.getByRole("alertdialog", { name: "레슨을 삭제할까요?" })
}

function readUnitRemoveDialog(): HTMLElement {
  return screen.getByRole("alertdialog", { name: "유닛을 삭제할까요?" })
}

function renderCourseEditor() {
  return render(
    <CourseEditorShell
      assetsResult={emptyAssetsResult}
      course={course}
      publishCourse={async (draft) => ({ status: "ok", value: draft })}
      saveCourse={async (draft) => ({ status: "ok", value: draft })}
      uploadAdminContentAsset={uploadAssetMock}
    />
  )
}
