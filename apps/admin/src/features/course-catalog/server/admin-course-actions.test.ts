import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  archiveCourseMock,
  createCourseMock,
  getSessionTokenMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  archiveCourseMock: vi.fn(),
  createCourseMock: vi.fn(),
  getSessionTokenMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }))
vi.mock("@/features/course-catalog/server/admin-course-catalog-dal", () => ({
  createAdminCourseCatalogDal: () => ({
    archiveCourse: archiveCourseMock,
    createCourse: createCourseMock,
  }),
}))
vi.mock("@/server/http/get-admin-http-transport", () => ({
  getServerAdminHttpTransport: vi.fn(),
}))
vi.mock("@/server/auth/get-admin-session-token", () => ({
  getServerAdminSessionToken: getSessionTokenMock,
}))

import {
  archiveAdminCourseAction,
  createAdminCourseAction,
} from "@/features/course-catalog/server/admin-course-actions"

describe("admin course catalog actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSessionTokenMock.mockResolvedValue("session-token")
  })

  it("생성과 보관 성공에서만 코스 목록을 재검증한다", async () => {
    createCourseMock.mockResolvedValue({ status: "ok", value: { id: "c1" } })
    archiveCourseMock.mockResolvedValue({
      status: "ok",
      value: { archived: true },
    })

    await createAdminCourseAction()
    await archiveAdminCourseAction("c1")

    expect(revalidatePathMock.mock.calls).toEqual([["/courses"], ["/courses"]])
  })

  it("잘못된 입력과 미인증 요청은 API를 호출하지 않는다", async () => {
    await archiveAdminCourseAction("")
    getSessionTokenMock.mockResolvedValue(null)
    await createAdminCourseAction()

    expect(archiveCourseMock).not.toHaveBeenCalled()
    expect(createCourseMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })
})
