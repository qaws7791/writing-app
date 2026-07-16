import { beforeEach, describe, expect, it, vi } from "vitest"
import { adminCourseEditorSchema } from "@/features/courses/admin-courses-api"

const {
  archiveCourseMock,
  createCourseMock,
  revalidatePathMock,
  publishCourseMock,
  saveCourseMock,
} = vi.hoisted(() => ({
  archiveCourseMock: vi.fn(),
  createCourseMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  publishCourseMock: vi.fn(),
  saveCourseMock: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }))
vi.mock("@/features/courses/admin-courses-api", () => ({
  adminCourseEditorSchema: { parse: (value: unknown) => value },
  createAdminCoursesApi: () => ({
    archiveCourse: archiveCourseMock,
    createCourse: createCourseMock,
    publishCourse: publishCourseMock,
    saveCourseEditor: saveCourseMock,
  }),
}))
vi.mock("@/lib/api/get-server-admin-http-transport", () => ({
  getServerAdminHttpTransport: vi.fn(),
}))
vi.mock("@/lib/auth/server-admin-session-token", () => ({
  getServerAdminSessionToken: vi.fn(),
}))

import {
  archiveAdminCourseAction,
  createAdminCourseAction,
} from "@/features/courses/admin-course-actions"

describe("admin course actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("생성과 보관 성공에서만 코스 목록을 재검증한다", async () => {
    createCourseMock.mockResolvedValue({ status: "ok", value: { id: "c1" } })
    archiveCourseMock.mockResolvedValue({
      status: "ok",
      value: { archived: true },
    })

    await createAdminCourseAction()
    await archiveAdminCourseAction("c1")

    expect(revalidatePathMock).toHaveBeenNthCalledWith(1, "/courses")
    expect(revalidatePathMock).toHaveBeenNthCalledWith(2, "/courses")
  })

  it("API 실패에서는 경로를 재검증하지 않는다", async () => {
    createCourseMock.mockResolvedValue({
      error: { code: "NETWORK_ERROR", message: "실패" },
      status: "error",
    })

    await createAdminCourseAction()

    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it("editor 저장 성공 시 목록과 상세를 재검증한다", async () => {
    const document = adminCourseEditorSchema.parse({
      category: "미분류",
      curriculumVersionId: "course-1-v2",
      description: "설명",
      editVersion: 0,
      id: "course-1",
      revision: 2,
      status: "active",
      title: "코스",
      units: [],
    })
    saveCourseMock.mockResolvedValue({ status: "ok", value: document })
    const { saveAdminCourseEditorAction } =
      await import("@/features/courses/admin-course-actions")

    await saveAdminCourseEditorAction(document)

    expect(revalidatePathMock.mock.calls).toEqual([
      ["/courses"],
      ["/courses/course-1"],
    ])
  })

  it("editor 발행 성공 시 목록과 상세를 재검증한다", async () => {
    const document = adminCourseEditorSchema.parse({
      category: "미분류",
      curriculumVersionId: "course-1-v2",
      description: "설명",
      editVersion: 1,
      id: "course-1",
      revision: 2,
      status: "active",
      title: "코스",
      units: [],
    })
    publishCourseMock.mockResolvedValue({
      status: "ok",
      value: {
        curriculumVersionId: "course-1-v2",
        publishedAt: "2026-07-17T00:00:00.000Z",
        revision: 2,
      },
    })
    const { publishAdminCourseAction } =
      await import("@/features/courses/admin-course-actions")

    await publishAdminCourseAction(document)

    expect(publishCourseMock).toHaveBeenCalledWith("course-1", document)
    expect(revalidatePathMock.mock.calls).toEqual([
      ["/courses"],
      ["/courses/course-1"],
    ])
  })
})
