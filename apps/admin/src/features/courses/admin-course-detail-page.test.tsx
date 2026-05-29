import * as React from "react"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AdminCourseDetailPage } from "@/features/courses/admin-course-detail-page"
import type { AdminApi } from "@/lib/api/admin-api"

type ButtonProps = React.ComponentProps<"button">

vi.mock("@workspace/ui/components/ui/button", async () => {
  const ReactModule = await import("react")

  return {
    Button: ({ children, ...props }: ButtonProps) =>
      ReactModule.createElement("button", props, children),
  }
})

vi.mock("@/components/admin-header", async () => {
  const ReactModule = await import("react")

  return {
    AdminHeader: ({
      actions,
      description,
      title,
    }: {
      actions?: React.ReactNode
      description?: string
      title: string
    }) =>
      ReactModule.createElement("header", null, [
        ReactModule.createElement("h1", { key: "title" }, title),
        description
          ? ReactModule.createElement("p", { key: "description" }, description)
          : null,
        actions
          ? ReactModule.createElement("div", { key: "actions" }, actions)
          : null,
      ]),
  }
})

const routerReplace = vi.fn()
const routerRefresh = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: routerRefresh,
    replace: routerReplace,
  }),
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  routerReplace.mockReset()
  routerRefresh.mockReset()
  window.history.replaceState(null, "", "/")
})

describe("AdminCourseDetailPage", () => {
  it("renders course studio shell", () => {
    render(
      <AdminCourseDetailPage
        adminApi={createAdminApiMock()}
        course={{
          id: "sentence-structure",
          title: "기초 문장 만들기",
          description: "문장의 뼈대를 세웁니다.",
          thumbnailPath: "/course-thumbnails/sentence.png",
          sortOrder: 1,
        }}
        selectedVersionId="sentence-structure-v2"
        urlState={{
          versionId: "sentence-structure-v2",
          view: "lesson",
          lessonId: "sentence-structure-01",
          stepId: null,
        }}
        versions={[
          {
            id: "sentence-structure-v2",
            courseId: "sentence-structure",
            versionNumber: 2,
            status: "draft",
            title: "v2",
            changelog: "draft",
            publishedAt: null,
            createdAt: "2026-05-28T00:00:00.000Z",
          },
        ]}
        version={{
          id: "sentence-structure-v2",
          courseId: "sentence-structure",
          versionNumber: 2,
          status: "draft",
          title: "v2",
          changelog: "draft",
          publishedAt: null,
          createdAt: "2026-05-28T00:00:00.000Z",
          revision: 1,
          chapters: [],
          steps: [],
        }}
      />
    )

    expect(screen.getByText("코스 편집")).toBeTruthy()
    expect(screen.getByText("v2 · 초안")).toBeTruthy()
    expect(screen.getByDisplayValue("기초 문장 만들기")).toBeTruthy()
    expect(screen.getByRole("button", { name: "저장" })).toBeTruthy()
  })

  it("creates an editable draft when the course has only a published version", async () => {
    const createCurriculumDraft = vi.fn<AdminApi["createCurriculumDraft"]>(
      async () => ({
        status: "ok",
        value: {
          ...versionSummaryFixture,
          id: "sentence-structure-v3",
          versionNumber: 3,
        },
      })
    )

    render(
      <AdminCourseDetailPage
        adminApi={createAdminApiMock({
          createCurriculumDraft,
        })}
        course={courseFixture}
        selectedVersionId="sentence-structure-v1"
        urlState={{
          versionId: "sentence-structure-v1",
          view: "lesson",
          lessonId: "sentence-structure-01",
          stepId: null,
        }}
        versions={[
          {
            ...versionSummaryFixture,
            id: "sentence-structure-v1",
            status: "published",
            versionNumber: 1,
          },
        ]}
        version={{
          ...versionFixture,
          id: "sentence-structure-v1",
          status: "published",
          versionNumber: 1,
        }}
      />
    )

    await waitFor(() => {
      expect(createCurriculumDraft).toHaveBeenCalledWith("sentence-structure")
    })
    expect(routerReplace).toHaveBeenCalledWith(
      "/courses/sentence-structure?version=sentence-structure-v3"
    )
  })

  it("saves edited course and lesson fields through the admin API", async () => {
    const user = userEvent.setup()
    const saveCourseEditorDocument = vi.fn<
      AdminApi["saveCourseEditorDocument"]
    >(async (input) => ({
      status: "ok",
      value: {
        ...versionFixture,
        revision: input.baseRevision + 1,
        steps: input.steps,
      },
    }))
    const adminApi = createAdminApiMock({
      saveCourseEditorDocument,
    })

    render(
      <AdminCourseDetailPage
        adminApi={adminApi}
        course={courseFixture}
        selectedVersionId="sentence-structure-v2"
        urlState={{
          versionId: "sentence-structure-v2",
          view: "lesson",
          lessonId: "sentence-structure-01",
          stepId: null,
        }}
        versions={[versionSummaryFixture]}
        version={versionFixture}
      />
    )

    await user.clear(screen.getByLabelText("코스 제목"))
    await user.type(screen.getByLabelText("코스 제목"), "수정 코스")
    await user.clear(screen.getByLabelText("레슨 제목"))
    await user.type(screen.getByLabelText("레슨 제목"), "수정 레슨")
    await user.click(screen.getByRole("button", { name: "저장" }))

    expect(saveCourseEditorDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: "sentence-structure",
        versionId: "sentence-structure-v2",
        baseRevision: 2,
        course: expect.objectContaining({
          title: "수정 코스",
        }),
        lessons: [
          expect.objectContaining({
            lessonId: "sentence-structure-01",
            title: "수정 레슨",
          }),
        ],
        steps: [
          expect.objectContaining({
            id: "sentence-structure-step-1",
            content: expect.objectContaining({
              bullets: ["원본 목표"],
            }),
          }),
        ],
      })
    )
    expect(screen.getByText("저장되었습니다.")).toBeTruthy()
  })

  it("saves edited step content through the admin API", async () => {
    const user = userEvent.setup()
    const saveCourseEditorDocument = vi.fn<
      AdminApi["saveCourseEditorDocument"]
    >(async (input) => ({
      status: "ok",
      value: {
        ...versionFixture,
        revision: input.baseRevision + 1,
        steps: input.steps,
      },
    }))

    render(
      <AdminCourseDetailPage
        adminApi={createAdminApiMock({
          saveCourseEditorDocument,
        })}
        course={courseFixture}
        selectedVersionId="sentence-structure-v2"
        urlState={{
          versionId: "sentence-structure-v2",
          view: "step",
          lessonId: "sentence-structure-01",
          stepId: "sentence-structure-step-1",
        }}
        versions={[versionSummaryFixture]}
        version={versionFixture}
      />
    )

    await user.clear(screen.getByLabelText("학습 포인트"))
    await user.type(screen.getByLabelText("학습 포인트"), "수정 목표")
    await user.click(screen.getByRole("button", { name: "저장" }))

    expect(saveCourseEditorDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: [
          expect.objectContaining({
            id: "sentence-structure-step-1",
            content: expect.objectContaining({
              bullets: ["수정 목표"],
            }),
          }),
        ],
      })
    )
  })

  it("saves added and archived curriculum nodes through the admin API", async () => {
    const user = userEvent.setup()
    const saveCourseEditorDocument = vi.fn<
      AdminApi["saveCourseEditorDocument"]
    >(async (input) => ({
      status: "ok",
      value: {
        ...versionFixture,
        revision: input.baseRevision + 1,
        chapters: input.chapters.map((chapter) => ({
          ...chapter,
          lessons: input.lessons
            .filter((lesson) => lesson.chapterId === chapter.id)
            .map((lesson) => ({
              id: lesson.id,
              lessonId: lesson.lessonId,
              title: lesson.title,
              description: lesson.description,
              sortOrder: lesson.sortOrder,
              status: lesson.status,
            })),
        })),
        steps: input.steps,
      },
    }))
    vi.spyOn(window, "confirm").mockReturnValue(true)

    render(
      <AdminCourseDetailPage
        adminApi={createAdminApiMock({
          saveCourseEditorDocument,
        })}
        course={courseFixture}
        selectedVersionId="sentence-structure-v2"
        urlState={{
          versionId: "sentence-structure-v2",
          view: "lesson",
          lessonId: "sentence-structure-01",
          stepId: null,
        }}
        versions={[versionSummaryFixture]}
        version={versionFixture}
      />
    )

    await user.click(screen.getByRole("button", { name: "챕터 추가" }))
    await user.click(screen.getByRole("button", { name: "첫 챕터 레슨 추가" }))
    await user.click(screen.getByRole("button", { name: "첫 레슨 레슨 보관" }))
    await user.click(screen.getByRole("button", { name: "저장" }))

    expect(saveCourseEditorDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        chapters: expect.arrayContaining([
          expect.objectContaining({
            title: "새 챕터",
          }),
        ]),
        lessons: expect.arrayContaining([
          expect.objectContaining({
            lessonId: "sentence-structure-01",
            status: "archived",
          }),
          expect.objectContaining({
            title: "새 레슨",
            status: "active",
          }),
        ]),
      })
    )
  })

  it("navigates between lesson, step, and preview editor views", async () => {
    const user = userEvent.setup()
    const saveCourseEditorDocument = vi.fn<
      AdminApi["saveCourseEditorDocument"]
    >(async (input) => ({
      status: "ok",
      value: {
        ...versionFixture,
        revision: input.baseRevision + 1,
        steps: input.steps,
      },
    }))

    render(
      <AdminCourseDetailPage
        adminApi={createAdminApiMock({
          saveCourseEditorDocument,
        })}
        course={courseFixture}
        selectedVersionId="sentence-structure-v2"
        urlState={{
          versionId: "sentence-structure-v2",
          view: "lesson",
          lessonId: "sentence-structure-01",
          stepId: null,
        }}
        versions={[versionSummaryFixture]}
        version={versionFixture}
      />
    )

    await user.click(screen.getByRole("button", { name: "학습 화면 미리보기" }))
    expect(window.location.pathname + window.location.search).toBe(
      "/courses/sentence-structure?version=sentence-structure-v2&view=preview&lessonId=sentence-structure-01"
    )

    cleanup()
    render(
      <AdminCourseDetailPage
        adminApi={createAdminApiMock({
          saveCourseEditorDocument,
        })}
        course={courseFixture}
        selectedVersionId="sentence-structure-v2"
        urlState={{
          versionId: "sentence-structure-v2",
          view: "lesson",
          lessonId: "sentence-structure-01",
          stepId: null,
        }}
        versions={[versionSummaryFixture]}
        version={versionFixture}
      />
    )

    await user.clear(screen.getByLabelText("코스 제목"))
    await user.type(screen.getByLabelText("코스 제목"), "전환 중 보존")
    await user.click(screen.getByRole("button", { name: "도입 스텝 열기" }))
    expect(routerReplace).not.toHaveBeenCalled()
    expect(window.location.pathname + window.location.search).toBe(
      "/courses/sentence-structure?version=sentence-structure-v2&view=step&lessonId=sentence-structure-01&stepId=sentence-structure-step-1"
    )
    expect(screen.getByLabelText("학습 포인트")).toBeTruthy()

    await user.click(screen.getByRole("button", { name: "저장" }))
    expect(saveCourseEditorDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        course: expect.objectContaining({
          title: "전환 중 보존",
        }),
      })
    )
  })

  it("renders the lesson settings view from settings URL state", () => {
    render(
      <AdminCourseDetailPage
        adminApi={createAdminApiMock()}
        course={courseFixture}
        selectedVersionId="sentence-structure-v2"
        urlState={{
          versionId: "sentence-structure-v2",
          view: "settings",
          lessonId: "sentence-structure-01",
          stepId: null,
        }}
        versions={[versionSummaryFixture]}
        version={versionFixture}
      />
    )

    expect(screen.getByRole("heading", { name: "레슨 설정" })).toBeTruthy()
    expect(screen.queryByText("학습 흐름")).toBeNull()
  })

  it("guards browser unload when the working copy has unsaved changes", async () => {
    const user = userEvent.setup()

    render(
      <AdminCourseDetailPage
        adminApi={createAdminApiMock()}
        course={courseFixture}
        selectedVersionId="sentence-structure-v2"
        urlState={{
          versionId: "sentence-structure-v2",
          view: "lesson",
          lessonId: "sentence-structure-01",
          stepId: null,
        }}
        versions={[versionSummaryFixture]}
        version={versionFixture}
      />
    )

    await user.clear(screen.getByLabelText("코스 제목"))
    await user.type(screen.getByLabelText("코스 제목"), "저장 전 변경")

    const event = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it("runs version actions from the version menu", async () => {
    const user = userEvent.setup()
    const createCurriculumDraft = vi.fn<AdminApi["createCurriculumDraft"]>(
      async () => ({
        status: "ok",
        value: {
          ...versionSummaryFixture,
          id: "sentence-structure-v3",
          versionNumber: 3,
        },
      })
    )
    const publishCurriculumVersion = vi.fn<
      AdminApi["publishCurriculumVersion"]
    >(async () => ({
      status: "ok",
      value: {
        ...versionSummaryFixture,
        status: "published",
        publishedAt: "2026-05-28T00:00:00.000Z",
      },
    }))
    const discardCurriculumVersion = vi.fn<
      AdminApi["discardCurriculumVersion"]
    >(async () => ({
      status: "ok",
      value: { versionId: "sentence-structure-v2" },
    }))
    const restoreCurriculumDraft = vi.fn<AdminApi["restoreCurriculumDraft"]>(
      async () => ({
        status: "ok",
        value: {
          ...versionSummaryFixture,
          id: "sentence-structure-v3",
          versionNumber: 3,
        },
      })
    )
    vi.spyOn(window, "confirm").mockReturnValue(true)

    render(
      <AdminCourseDetailPage
        adminApi={createAdminApiMock({
          createCurriculumDraft,
          discardCurriculumVersion,
          publishCurriculumVersion,
          restoreCurriculumDraft,
        })}
        course={courseFixture}
        selectedVersionId="sentence-structure-v2"
        urlState={{
          versionId: "sentence-structure-v2",
          view: "lesson",
          lessonId: "sentence-structure-01",
          stepId: null,
        }}
        versions={[
          versionSummaryFixture,
          {
            ...versionSummaryFixture,
            id: "sentence-structure-v1",
            versionNumber: 1,
            status: "published",
            publishedAt: "2026-05-28T00:00:00.000Z",
          },
        ]}
        version={versionFixture}
      />
    )

    await user.click(screen.getByRole("button", { name: "버전 메뉴" }))
    await user.click(screen.getByRole("button", { name: "새 초안 생성" }))
    expect(createCurriculumDraft).toHaveBeenCalledWith("sentence-structure")
    expect(routerReplace).toHaveBeenCalledWith(
      "/courses/sentence-structure?version=sentence-structure-v3"
    )

    await user.click(screen.getByRole("button", { name: "현재 초안 발행" }))
    expect(publishCurriculumVersion).toHaveBeenCalledWith(
      "sentence-structure",
      "sentence-structure-v2"
    )

    await user.click(screen.getByRole("button", { name: "현재 초안 폐기" }))
    expect(discardCurriculumVersion).toHaveBeenCalledWith(
      "sentence-structure",
      "sentence-structure-v2"
    )

    await user.click(screen.getByRole("button", { name: "v1에서 복원" }))
    expect(restoreCurriculumDraft).toHaveBeenCalledWith("sentence-structure", {
      replaceDraft: true,
      sourceVersionId: "sentence-structure-v1",
    })
  })

  it("does not run destructive version actions when confirmation is cancelled", async () => {
    const user = userEvent.setup()
    const discardCurriculumVersion = vi.fn<
      AdminApi["discardCurriculumVersion"]
    >(async () => ({
      status: "ok",
      value: { versionId: "sentence-structure-v2" },
    }))
    vi.spyOn(window, "confirm").mockReturnValue(false)

    render(
      <AdminCourseDetailPage
        adminApi={createAdminApiMock({
          discardCurriculumVersion,
        })}
        course={courseFixture}
        selectedVersionId="sentence-structure-v2"
        urlState={{
          versionId: "sentence-structure-v2",
          view: "lesson",
          lessonId: "sentence-structure-01",
          stepId: null,
        }}
        versions={[versionSummaryFixture]}
        version={versionFixture}
      />
    )

    await user.click(screen.getByRole("button", { name: "버전 메뉴" }))
    await user.click(screen.getByRole("button", { name: "현재 초안 폐기" }))

    expect(discardCurriculumVersion).not.toHaveBeenCalled()
  })
})

const courseFixture = {
  id: "sentence-structure",
  title: "기초 문장 만들기",
  description: "문장의 뼈대를 세웁니다.",
  thumbnailPath: "/course-thumbnails/sentence.png",
  sortOrder: 1,
}

const versionSummaryFixture = {
  id: "sentence-structure-v2",
  courseId: "sentence-structure",
  versionNumber: 2,
  status: "draft" as const,
  title: "v2",
  changelog: "draft",
  publishedAt: null,
  createdAt: "2026-05-28T00:00:00.000Z",
}

const versionFixture = {
  ...versionSummaryFixture,
  revision: 2,
  chapters: [
    {
      id: "chapter-1",
      label: "1",
      title: "첫 챕터",
      sortOrder: 1,
      status: "active" as const,
      lessons: [
        {
          id: "version-lesson-1",
          lessonId: "sentence-structure-01",
          title: "첫 레슨",
          description: "레슨 설명",
          sortOrder: 1,
          status: "active" as const,
        },
      ],
    },
  ],
  steps: [
    {
      id: "sentence-structure-step-1",
      lessonId: "sentence-structure-01",
      type: "INTRO" as const,
      title: "도입",
      sortOrder: 1,
      points: 0,
      required: true,
      status: "active" as const,
      content: {
        title: "도입",
        category: "문법",
        bullets: ["원본 목표"],
        estimatedMinutes: 8,
      },
    },
  ],
}

function createAdminApiMock(overrides: Partial<AdminApi> = {}): AdminApi {
  return {
    async createCurriculumDraft() {
      return { status: "ok", value: versionSummaryFixture }
    },
    async discardCurriculumVersion() {
      return { status: "ok", value: { versionId: "sentence-structure-v2" } }
    },
    async getCourseCurriculumVersionDetail() {
      return { status: "ok", value: versionFixture }
    },
    async getCourseDetail() {
      return { status: "ok", value: courseFixture }
    },
    async getCourseEditorDocument() {
      return {
        status: "ok",
        value: {
          course: courseFixture,
          versions: [versionSummaryFixture],
          version: versionFixture,
        },
      }
    },
    async getCourseLessonDetail() {
      return {
        status: "ok",
        value: {
          id: "sentence-structure-01",
          courseId: "sentence-structure",
          title: "첫 레슨",
          categoryId: "grammar",
          unitNumber: 1,
          nextLessonId: null,
          steps: versionFixture.steps,
        },
      }
    },
    async listCourseTree() {
      return { status: "ok", value: { courses: [] } }
    },
    async listCourses() {
      return {
        status: "ok",
        value: {
          courses: [],
          pagination: {
            page: 1,
            pageSize: 10,
            totalCount: 0,
            totalPages: 1,
          },
          query: "",
        },
      }
    },
    async listCurriculumVersions() {
      return { status: "ok", value: { versions: [versionSummaryFixture] } }
    },
    async listUsers() {
      return { status: "ok", value: { users: [] } }
    },
    async publishCurriculumVersion() {
      return {
        status: "ok",
        value: {
          ...versionSummaryFixture,
          status: "published",
          publishedAt: "2026-05-28T00:00:00.000Z",
        },
      }
    },
    async restoreCurriculumDraft() {
      return { status: "ok", value: versionSummaryFixture }
    },
    async saveCurriculumVersionContent(input) {
      return {
        status: "ok",
        value: {
          ...versionFixture,
          revision: input.baseRevision + 1,
          steps: input.steps,
        },
      }
    },
    async saveCourseEditorDocument(input) {
      return {
        status: "ok",
        value: {
          ...versionFixture,
          revision: input.baseRevision + 1,
          steps: input.steps,
        },
      }
    },
    ...overrides,
  }
}
