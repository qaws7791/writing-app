import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { adminCourseEditorSchema } from "@/features/course-editor/model/admin-course-editor"

import { CourseEditorShell } from "@/features/course-editor/ui/course-editor-shell"
import type { AdminCourseDetail } from "@/features/course-editor/model/admin-course-editor"

const { getCourseEditorMock, routerPushMock, uploadAssetMock } = vi.hoisted(
  () => ({
    getCourseEditorMock: vi.fn(),
    routerPushMock: vi.fn(),
    uploadAssetMock: vi.fn(),
  })
)

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}))

vi.mock("@workspace/http-client/admin", () => ({
  getAdminCourseEditor: getCourseEditorMock,
  uploadAdminContentAsset: uploadAssetMock,
}))

const course: AdminCourseDetail = adminCourseEditorSchema.parse({
  assets: [],
  category: "입문자를 위한 코스",
  coverAssetId: null,
  curriculumVersionId: "c1-v3",
  description: "글쓰기 입문 과정",
  editVersion: 2,
  id: "c1",
  revision: 3,
  status: "active",
  title: "글쓰기 첫걸음 30일",
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

describe("CourseEditorShell", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getCourseEditorMock.mockResolvedValue(course)
    routerPushMock.mockReset()
    uploadAssetMock.mockReset()
  })

  it("Kwep 기준 코스 제목, 강의 정보 탭, 커리큘럼 탭을 렌더링한다", async () => {
    const user = userEvent.setup()

    render(
      <CourseEditorShell
        course={course}
        publishCourse={async () => ({
          status: "ok",
          value: {
            curriculumVersionId: course.curriculumVersionId,
            publishedAt: "2026-07-17T00:00:00.000Z",
            revision: course.revision,
          },
        })}
        saveCourse={async (draft) => ({
          status: "ok",
          value: { ...draft, editVersion: draft.editVersion + 1 },
        })}
      />
    )

    expect(
      screen.getByRole("heading", { name: "글쓰기 첫걸음 30일" })
    ).toBeVisible()
    expect(screen.getByRole("link", { name: "콘텐츠 관리" })).toBeVisible()
    expect(screen.getByRole("button", { name: "강의 정보" })).toBeVisible()
    expect(screen.getByRole("button", { name: "커리큘럼" })).toBeVisible()
    expect(screen.getByRole("button", { name: "초안 발행" })).toBeVisible()
    expect(screen.getByLabelText("제목")).toHaveValue("글쓰기 첫걸음 30일")

    await user.click(screen.getByRole("button", { name: "커리큘럼" }))

    expect(screen.getByText("유닛 1개 · 레슨 1개")).toBeVisible()
    expect(screen.getByText("UNIT 1")).toBeVisible()
    expect(screen.getByDisplayValue("1주차")).toBeVisible()
    expect(screen.getByDisplayValue("첫 레슨")).toBeVisible()
  })

  it("표지의 대체 텍스트와 업로드 진행을 표시하고 asset ID를 저장한다", async () => {
    const user = userEvent.setup()
    const saveCourse = vi.fn(async (draft: AdminCourseDetail) => ({
      status: "ok" as const,
      value: { ...draft, editVersion: draft.editVersion + 1 },
    }))
    let finishUpload:
      | ((value: AdminCourseDetail["assets"][number]) => void)
      | undefined
    uploadAssetMock.mockReturnValue(
      new Promise((resolve) => {
        finishUpload = resolve
      })
    )

    render(
      <CourseEditorShell
        course={course}
        publishCourse={async () => ({
          status: "ok",
          value: {
            curriculumVersionId: course.curriculumVersionId,
            publishedAt: "2026-07-17T00:00:00.000Z",
            revision: course.revision,
          },
        })}
        saveCourse={saveCourse}
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
      altText: "글쓰기 코스 표지",
      byteSize: 1024,
      contentType: "image/webp",
      courseId: course.id,
      curriculumVersionId: course.curriculumVersionId,
      id: "asset-cover-1",
      kind: "course-cover",
      url: "https://assets.example.test/cover.webp",
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

  it("저장된 draft를 확인 뒤 발행하고 다음 draft를 다시 읽는다", async () => {
    const user = userEvent.setup()
    const nextDraft = {
      ...course,
      curriculumVersionId: "c1-v4",
      editVersion: 0,
      revision: 4,
    }
    const publishCourse = vi.fn(async () => ({
      status: "ok" as const,
      value: {
        curriculumVersionId: course.curriculumVersionId,
        publishedAt: "2026-07-17T00:00:00.000Z",
        revision: course.revision,
      },
    }))
    const loadLatestCourse = vi.fn(async () => nextDraft)
    getCourseEditorMock.mockImplementation(loadLatestCourse)

    render(
      <CourseEditorShell
        course={course}
        publishCourse={publishCourse}
        saveCourse={async (draft) => ({ status: "ok", value: draft })}
      />
    )

    await user.click(screen.getByRole("button", { name: "초안 발행" }))
    const dialog = screen.getByRole("alertdialog", {
      name: "현재 초안을 발행할까요?",
    })
    expect(publishCourse).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole("button", { name: "발행하기" }))

    expect(publishCourse).toHaveBeenCalledWith(course)
    expect(loadLatestCourse).toHaveBeenCalledWith(course.id)
    expect(await screen.findByText("리비전 3을 발행했습니다.")).toBeVisible()
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "글쓰기 첫걸음 30일" })
      ).toHaveFocus()
    )
  })

  it("저장하지 않은 변경이 있으면 탭 이동을 취소하거나 확인한다", async () => {
    const user = userEvent.setup()

    renderCourseEditor()

    await user.type(screen.getByLabelText("제목"), " 수정")
    await user.click(screen.getByRole("button", { name: "커리큘럼" }))

    const dialog = screen.getByRole("alertdialog", {
      name: "편집 화면을 이동할까요?",
    })
    await user.click(within(dialog).getByRole("button", { name: "취소" }))

    expect(screen.getByLabelText("제목")).toBeVisible()

    await user.click(screen.getByRole("button", { name: "커리큘럼" }))
    await user.click(
      within(
        screen.getByRole("alertdialog", {
          name: "편집 화면을 이동할까요?",
        })
      ).getByRole("button", { name: "이동하기" })
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

  it("저장하지 않은 변경이 있으면 목록 이동을 취소하거나 확인한다", async () => {
    const user = userEvent.setup()

    renderCourseEditor()

    await user.type(screen.getByLabelText("제목"), " 수정")
    const courseListLink = screen.getByRole("link", { name: "콘텐츠 관리" })
    const modifiedClick = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    })
    courseListLink.addEventListener(
      "click",
      (event) => event.preventDefault(),
      {
        once: true,
      }
    )
    courseListLink.dispatchEvent(modifiedClick)

    expect(
      screen.queryByRole("alertdialog", {
        name: "콘텐츠 관리로 이동할까요?",
      })
    ).not.toBeInTheDocument()
    expect(routerPushMock).not.toHaveBeenCalled()

    await user.click(courseListLink)

    let dialog = screen.getByRole("alertdialog", {
      name: "콘텐츠 관리로 이동할까요?",
    })
    await user.click(within(dialog).getByRole("button", { name: "취소" }))
    expect(routerPushMock).not.toHaveBeenCalled()

    await user.click(screen.getByRole("link", { name: "콘텐츠 관리" }))
    dialog = screen.getByRole("alertdialog", {
      name: "콘텐츠 관리로 이동할까요?",
    })
    await user.click(
      within(dialog).getByRole("button", { name: "목록으로 이동" })
    )

    expect(routerPushMock).toHaveBeenCalledWith("/courses")
  })

  it("레슨과 유닛 삭제를 각각 취소하거나 확인한다", async () => {
    const user = userEvent.setup()

    renderCourseEditor()
    await user.click(screen.getByRole("button", { name: "커리큘럼" }))

    await user.click(screen.getByRole("button", { name: "첫 레슨 레슨 삭제" }))
    let dialog = screen.getByRole("alertdialog", {
      name: "레슨을 삭제할까요?",
    })
    await user.click(within(dialog).getByRole("button", { name: "취소" }))
    expect(screen.getByDisplayValue("첫 레슨")).toBeVisible()

    await user.click(screen.getByRole("button", { name: "첫 레슨 레슨 삭제" }))
    dialog = screen.getByRole("alertdialog", {
      name: "레슨을 삭제할까요?",
    })
    await user.click(within(dialog).getByRole("button", { name: "레슨 삭제" }))
    expect(screen.queryByDisplayValue("첫 레슨")).not.toBeInTheDocument()
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "글쓰기 첫걸음 30일" })
      ).toHaveFocus()
    )

    await user.click(screen.getByRole("button", { name: "1주차 유닛 삭제" }))
    dialog = screen.getByRole("alertdialog", {
      name: "유닛을 삭제할까요?",
    })
    await user.click(within(dialog).getByRole("button", { name: "취소" }))
    expect(screen.getByDisplayValue("1주차")).toBeVisible()

    await user.click(screen.getByRole("button", { name: "1주차 유닛 삭제" }))
    dialog = screen.getByRole("alertdialog", {
      name: "유닛을 삭제할까요?",
    })
    await user.click(within(dialog).getByRole("button", { name: "유닛 삭제" }))
    expect(screen.queryByDisplayValue("1주차")).not.toBeInTheDocument()
  })
})

function renderCourseEditor() {
  return render(
    <CourseEditorShell
      course={course}
      publishCourse={async () => ({
        status: "ok",
        value: {
          curriculumVersionId: course.curriculumVersionId,
          publishedAt: "2026-07-17T00:00:00.000Z",
          revision: course.revision,
        },
      })}
      saveCourse={async (draft) => ({ status: "ok", value: draft })}
    />
  )
}
