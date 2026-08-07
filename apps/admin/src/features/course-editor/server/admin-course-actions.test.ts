import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminCourseEditorSchema } from "@/features/course-editor/model/admin-course-editor"

const {
  getCourseEditorMock,
  getServerAdminRequestOptionsMock,
  publishCourseMock,
  revalidatePathMock,
  saveCourseMock,
  uploadContentAssetMock,
} = vi.hoisted(() => ({
  getCourseEditorMock: vi.fn(),
  getServerAdminRequestOptionsMock: vi.fn(),
  publishCourseMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  saveCourseMock: vi.fn(),
  uploadContentAssetMock: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }))
vi.mock("@workspace/http-client/admin", () => ({
  getAdminCourseEditor: getCourseEditorMock,
  publishAdminCourse: publishCourseMock,
  saveAdminCourseEditor: saveCourseMock,
  uploadAdminContentAsset: uploadContentAssetMock,
}))
vi.mock("@/server/http/admin-api-request-options", () => ({
  getServerAdminRequestOptions: getServerAdminRequestOptionsMock,
}))

import {
  publishAdminCourseAction,
  saveAdminCourseEditorAction,
} from "@/features/course-editor/server/admin-course-actions"
import { createAdminCourseEditorFixture } from "@/features/course-editor/test/fixtures/admin-course-editor"
import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

const document = adminCourseEditorSchema.parse(
  createAdminCourseEditorFixture({ description: "설명", title: "코스" })
)
const requestOptions = { cache: "no-store" } as const
const nextDraft = {
  ...document,
  curriculumVersionId: "course-1-v3",
  editVersion: 0,
  revision: 3,
}

describe("admin course editor actions", () => {
  beforeEach(() => {
    getServerAdminRequestOptionsMock.mockResolvedValue(requestOptions)
  })

  it("잘못된 입력은 generated mutation을 호출하지 않는다", async () => {
    await saveAdminCourseEditorAction({ id: "" })

    expect(saveCourseMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it("세션 없는 요청은 generated mutation을 호출하지 않는다", async () => {
    getServerAdminRequestOptionsMock.mockResolvedValue(null)

    await publishAdminCourseAction(document)

    expect(publishCourseMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it("stale editVersion 409이면 인증된 최신 문서를 충돌 결과로 반환한다", async () => {
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
    getCourseEditorMock.mockResolvedValue(nextDraft)

    await expect(saveAdminCourseEditorAction(document)).resolves.toEqual({
      latest: nextDraft,
      status: "conflict",
    })
    expect(getCourseEditorMock).toHaveBeenCalledWith("course-1", requestOptions)
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })
})
