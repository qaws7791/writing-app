import { describe, expect, it, vi } from "vitest"

const { getResourceDocumentMock, notFoundMock } = vi.hoisted(() => ({
  getResourceDocumentMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("not-found")
  }),
}))

vi.mock("next/navigation", () => ({ notFound: notFoundMock }))
vi.mock(
  "@/features/resource-document-editor/api/resource-document-http-adapter",
  () => ({
    createResourceDocumentHttpAdapter: () => ({
      getResourceDocument: getResourceDocumentMock,
    }),
  })
)
vi.mock("@/server/http/get-admin-http-transport", () => ({
  getServerAdminHttpTransport: vi.fn(),
}))

import AdminResourceDocumentRoute from "@/app/(admin)/resources/[documentId]/page"

describe("admin resource document route", () => {
  it("잘못된 document ID는 API 호출 전에 notFound로 수렴한다", async () => {
    await expect(
      AdminResourceDocumentRoute({
        params: Promise.resolve({ documentId: "" }),
      })
    ).rejects.toThrow("not-found")

    expect(notFoundMock).toHaveBeenCalledTimes(1)
    expect(getResourceDocumentMock).not.toHaveBeenCalled()
  })
})
