import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  archiveCourseMock,
  createCourseMock,
  getServerAdminRequestOptionsMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  archiveCourseMock: vi.fn(),
  createCourseMock: vi.fn(),
  getServerAdminRequestOptionsMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }))
vi.mock("@workspace/http-client/admin", () => ({
  archiveAdminCourse: archiveCourseMock,
  createAdminCourse: createCourseMock,
}))
vi.mock("@/server/http/admin-api-request-options", () => ({
  getServerAdminRequestOptions: getServerAdminRequestOptionsMock,
}))

import {
  archiveAdminCourseAction,
  createAdminCourseAction,
} from "@/features/course-catalog/server/admin-course-actions"
import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

const requestOptions = { cache: "no-store" } as const

describe("admin course catalog actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerAdminRequestOptionsMock.mockResolvedValue(requestOptions)
  })

  it("generated 생성·보관 성공에서만 코스 목록을 재검증한다", async () => {
    createCourseMock.mockResolvedValue({ id: "c1" })
    archiveCourseMock.mockResolvedValue({ archived: true })

    await createAdminCourseAction()
    await archiveAdminCourseAction("c1")

    expect(createCourseMock).toHaveBeenCalledWith(requestOptions)
    expect(archiveCourseMock).toHaveBeenCalledWith("c1", requestOptions)
    expect(revalidatePathMock.mock.calls).toEqual([["/courses"], ["/courses"]])
  })

  it("잘못된 입력과 세션 없는 요청은 generated mutation을 호출하지 않는다", async () => {
    await archiveAdminCourseAction("")
    getServerAdminRequestOptionsMock.mockResolvedValue(null)
    await createAdminCourseAction()

    expect(archiveCourseMock).not.toHaveBeenCalled()
    expect(createCourseMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it("보관 conflict를 보존하고 목록을 재검증하지 않는다", async () => {
    archiveCourseMock.mockRejectedValue(
      new GeneratedApiClientError({
        error: {
          code: "CONTENT_CONFLICT",
          message: "코스를 보관할 수 없습니다.",
          requestId: "archive-conflict",
        },
        kind: "http",
        retryAfterSeconds: null,
        status: 409,
      })
    )

    await expect(archiveAdminCourseAction("c1")).resolves.toMatchObject({
      error: { code: "CONTENT_CONFLICT", status: 409 },
      status: "error",
    })
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })
})
