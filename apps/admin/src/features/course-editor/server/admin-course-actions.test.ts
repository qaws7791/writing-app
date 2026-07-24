import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminCourseEditorSchema } from "@/features/course-editor/model/admin-course-editor"

const {
  getServerAdminRequestOptionsMock,
  publishCourseMock,
  revalidatePathMock,
  saveCourseMock,
} = vi.hoisted(() => ({
  getServerAdminRequestOptionsMock: vi.fn(),
  publishCourseMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  saveCourseMock: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }))
vi.mock("@workspace/http-client/admin", () => ({
  publishAdminCourse: publishCourseMock,
  saveAdminCourseEditor: saveCourseMock,
}))
vi.mock("@/server/http/admin-api-request-options", () => ({
  getServerAdminRequestOptions: getServerAdminRequestOptionsMock,
}))

import {
  publishAdminCourseAction,
  saveAdminCourseEditorAction,
} from "@/features/course-editor/server/admin-course-actions"
import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

const document = adminCourseEditorSchema.parse({
  assets: [],
  category: "미분류",
  coverAssetId: null,
  curriculumVersionId: "course-1-v2",
  description: "설명",
  editVersion: 1,
  id: "course-1",
  revision: 2,
  status: "active",
  title: "코스",
  units: [],
})
const requestOptions = { cache: "no-store" } as const

describe("admin course editor actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerAdminRequestOptionsMock.mockResolvedValue(requestOptions)
  })

  it("generated 저장·발행 성공 시 write DTO와 If-Match를 전달하고 경로를 재검증한다", async () => {
    saveCourseMock.mockResolvedValue(document)
    publishCourseMock.mockResolvedValue({
      curriculumVersionId: "course-1-v2",
      publishedAt: "2026-07-17T00:00:00.000Z",
      revision: 2,
    })

    await saveAdminCourseEditorAction(document)
    await publishAdminCourseAction(document)

    expect(getServerAdminRequestOptionsMock).toHaveBeenNthCalledWith(1, {
      headers: { "If-Match": '"1"' },
    })
    expect(getServerAdminRequestOptionsMock).toHaveBeenNthCalledWith(2, {
      headers: { "If-Match": '"1"' },
    })
    expect(saveCourseMock).toHaveBeenCalledWith(
      "course-1",
      expect.not.objectContaining({ assets: expect.anything() }),
      requestOptions
    )
    expect(publishCourseMock).toHaveBeenCalledWith("course-1", requestOptions)
    expect(revalidatePathMock.mock.calls).toEqual([
      ["/courses"],
      ["/courses/course-1"],
      ["/courses"],
      ["/courses/course-1"],
    ])
  })

  it("잘못된 입력과 세션 없는 요청은 generated mutation을 호출하지 않는다", async () => {
    await saveAdminCourseEditorAction({ id: "" })
    getServerAdminRequestOptionsMock.mockResolvedValue(null)
    await publishAdminCourseAction(document)

    expect(saveCourseMock).not.toHaveBeenCalled()
    expect(publishCourseMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it("stale editVersion 409를 보존하고 경로를 재검증하지 않는다", async () => {
    saveCourseMock.mockRejectedValue(
      new GeneratedApiClientError({
        error: {
          code: "CONTENT_CONFLICT",
          message: "편집 버전이 충돌했습니다.",
          requestId: "course-save-conflict",
        },
        kind: "http",
        retryAfterSeconds: null,
        status: 409,
      })
    )

    await expect(saveAdminCourseEditorAction(document)).resolves.toMatchObject({
      error: { code: "CONTENT_CONFLICT", status: 409 },
      status: "error",
    })
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })
})
