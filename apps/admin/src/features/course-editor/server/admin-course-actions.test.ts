import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminCourseEditorSchema } from "@/features/course-editor/model/admin-course-editor"

const {
  getSessionTokenMock,
  publishCourseMock,
  revalidatePathMock,
  saveCourseMock,
} = vi.hoisted(() => ({
  getSessionTokenMock: vi.fn(),
  publishCourseMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  saveCourseMock: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }))
vi.mock("@/features/course-editor/api/admin-course-editor-api", () => ({
  createAdminCourseEditorApi: () => ({
    publishCourse: publishCourseMock,
    saveCourseEditor: saveCourseMock,
  }),
}))
vi.mock("@/server/http/get-admin-http-transport", () => ({
  getServerAdminHttpTransport: vi.fn(),
}))
vi.mock("@/server/auth/get-admin-session-token", () => ({
  getServerAdminSessionToken: getSessionTokenMock,
}))

import {
  publishAdminCourseAction,
  saveAdminCourseEditorAction,
} from "@/features/course-editor/server/admin-course-actions"

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

describe("admin course editor actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSessionTokenMock.mockResolvedValue("session-token")
  })

  it("저장과 발행 성공 시 목록과 상세만 재검증한다", async () => {
    saveCourseMock.mockResolvedValue({ status: "ok", value: document })
    publishCourseMock.mockResolvedValue({
      status: "ok",
      value: {
        curriculumVersionId: "course-1-v2",
        publishedAt: "2026-07-17T00:00:00.000Z",
        revision: 2,
      },
    })

    await saveAdminCourseEditorAction(document)
    await publishAdminCourseAction(document)

    expect(revalidatePathMock.mock.calls).toEqual([
      ["/courses"],
      ["/courses/course-1"],
      ["/courses"],
      ["/courses/course-1"],
    ])
  })

  it("잘못된 입력과 미인증 요청은 API를 호출하지 않는다", async () => {
    await saveAdminCourseEditorAction({ id: "" })
    getSessionTokenMock.mockResolvedValue(null)
    await publishAdminCourseAction(document)

    expect(saveCourseMock).not.toHaveBeenCalled()
    expect(publishCourseMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })
})
