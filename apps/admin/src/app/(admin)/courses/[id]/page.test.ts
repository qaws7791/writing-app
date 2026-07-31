import { beforeEach, describe, expect, it, vi } from "vitest"

const { getCourseEditorMock, getServerAdminRequestOptionsMock, notFoundMock } =
  vi.hoisted(() => ({
    getCourseEditorMock: vi.fn(),
    getServerAdminRequestOptionsMock: vi.fn(),
    notFoundMock: vi.fn(() => {
      throw new Error("not-found")
    }),
  }))

vi.mock("next/navigation", () => ({ notFound: notFoundMock }))
vi.mock("@workspace/http-client/admin", () => ({
  getAdminCourseEditor: getCourseEditorMock,
  publishAdminCourse: vi.fn(),
  saveAdminCourseEditor: vi.fn(),
  uploadAdminContentAsset: vi.fn(),
}))
vi.mock("@/server/http/admin-api-request-options", () => ({
  getServerAdminRequestOptions: getServerAdminRequestOptionsMock,
}))

import AdminCourseDetailRoute from "@/app/(admin)/courses/[id]/page"

describe("admin course detail route", () => {
  beforeEach(() => {
    getServerAdminRequestOptionsMock.mockResolvedValue({
      cache: "no-store",
    })
  })

  it("잘못된 course ID는 API 호출 전에 notFound로 수렴한다", async () => {
    await expect(
      AdminCourseDetailRoute({
        params: Promise.resolve({ id: " " }),
      })
    ).rejects.toThrow("not-found")

    expect(getCourseEditorMock).not.toHaveBeenCalled()
  })

  it("세션이 없으면 코스 편집 문서를 조회하지 않는다", async () => {
    getServerAdminRequestOptionsMock.mockResolvedValue(null)

    await AdminCourseDetailRoute({
      params: Promise.resolve({ id: "course-1" }),
    })

    expect(getCourseEditorMock).not.toHaveBeenCalled()
  })
})
