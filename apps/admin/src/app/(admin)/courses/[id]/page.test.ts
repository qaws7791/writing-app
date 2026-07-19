import { describe, expect, it, vi } from "vitest"

const { getCourseEditorMock, notFoundMock } = vi.hoisted(() => ({
  getCourseEditorMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("not-found")
  }),
}))

vi.mock("next/navigation", () => ({ notFound: notFoundMock }))
vi.mock("@/features/course-editor/api/admin-course-editor-api", () => ({
  createAdminCourseEditorApi: () => ({
    getCourseEditor: getCourseEditorMock,
  }),
}))
vi.mock("@/server/http/get-admin-http-transport", () => ({
  getServerAdminHttpTransport: vi.fn(),
}))
vi.mock("@/server/env/admin-runtime-config", () => ({
  readServerApiBaseUrl: vi.fn(() => "http://localhost:4000"),
}))

import AdminCourseDetailRoute from "@/app/(admin)/courses/[id]/page"

describe("admin course detail route", () => {
  it("잘못된 course ID는 API 호출 전에 notFound로 수렴한다", async () => {
    await expect(
      AdminCourseDetailRoute({
        params: Promise.resolve({ id: " " }),
      })
    ).rejects.toThrow("not-found")

    expect(notFoundMock).toHaveBeenCalledTimes(1)
    expect(getCourseEditorMock).not.toHaveBeenCalled()
  })
})
