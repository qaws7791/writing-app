// @vitest-environment jsdom
import { act, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useVersionHistory } from "./use-version-history"
import type {
  VersionDetail,
  VersionSummary,
} from "@/features/writing/sync/types"
import type { WritingContent } from "@/domain/writing"
import { renderHookWithQueryClient } from "@/test-support/query-client"

const testContent: WritingContent = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "테스트" }] }],
}

const mockVersions: VersionSummary[] = [
  {
    id: 2,
    writingId: 1,
    version: 20,
    title: "버전 20",
    createdAt: "2026-03-25T13:00:00.000Z",
    reason: "auto",
  },
  {
    id: 1,
    writingId: 1,
    version: 10,
    title: "버전 10",
    createdAt: "2026-03-25T12:00:00.000Z",
    reason: "auto",
  },
]

const mockDetail: VersionDetail = {
  id: 2,
  writingId: 1,
  version: 20,
  title: "버전 20",
  createdAt: "2026-03-25T13:00:00.000Z",
  reason: "auto",
  content: testContent,
}

const mockTransport = {
  listVersions: vi.fn(),
  getVersion: vi.fn(),
  push: vi.fn(),
  pull: vi.fn(),
}

vi.mock("@/features/writing/sync/sync-transport", () => ({
  createSyncTransport: () => mockTransport,
}))

vi.mock("@/foundation/config/env", () => ({
  env: { NEXT_PUBLIC_API_BASE_URL: "http://localhost:3000" },
}))

vi.mock("@/foundation/lib/api-base-url", () => ({
  resolveBrowserApiBaseUrl: (url: string) => url,
}))

describe("useVersionHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("open이 true일 때 버전 목록을 로드한다", async () => {
    mockTransport.listVersions.mockResolvedValue({ items: mockVersions })

    const { result } = renderHookWithQueryClient(() =>
      useVersionHistory({ writingId: 1, open: true })
    )

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.versions).toEqual(mockVersions)
    expect(mockTransport.listVersions).toHaveBeenCalledWith(1, 50)
  })

  it("open이 false이면 로드하지 않는다", () => {
    renderHookWithQueryClient(() =>
      useVersionHistory({ writingId: 1, open: false })
    )

    expect(mockTransport.listVersions).not.toHaveBeenCalled()
  })

  it("버전 목록 로드 실패 시 에러 상태를 설정한다", async () => {
    mockTransport.listVersions.mockRejectedValue(new Error("network error"))

    const { result } = renderHookWithQueryClient(() =>
      useVersionHistory({ writingId: 1, open: true })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe("버전 기록을 불러올 수 없습니다.")
  })

  it("selectVersion으로 버전 상세를 로드한다", async () => {
    mockTransport.listVersions.mockResolvedValue({ items: mockVersions })
    mockTransport.getVersion.mockResolvedValue(mockDetail)

    const { result } = renderHookWithQueryClient(() =>
      useVersionHistory({ writingId: 1, open: true })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.selectVersion(20)
    })

    await waitFor(() => {
      expect(result.current.selectedDetail).toEqual(mockDetail)
    })
    expect(mockTransport.getVersion).toHaveBeenCalledWith(1, 20)
  })

  it("restoreVersion으로 복원을 수행한다", async () => {
    const onRestoreComplete = vi.fn()
    mockTransport.listVersions.mockResolvedValue({ items: mockVersions })
    mockTransport.getVersion.mockResolvedValue(mockDetail)
    mockTransport.push.mockResolvedValue({
      accepted: true,
      serverVersion: 21,
    })

    const { result } = renderHookWithQueryClient(() =>
      useVersionHistory({
        writingId: 1,
        open: true,
        onRestoreComplete,
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.selectVersion(20)
    })

    await waitFor(() => {
      expect(result.current.selectedDetail).toEqual(mockDetail)
    })

    act(() => {
      result.current.restoreVersion(20)
    })

    await waitFor(() => {
      expect(mockTransport.push).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          restoreFrom: 20,
        })
      )
    })
    await waitFor(() => {
      expect(onRestoreComplete).toHaveBeenCalledWith(mockDetail)
    })
  })

  it("복원 실패 시 에러 상태를 설정한다", async () => {
    mockTransport.listVersions.mockResolvedValue({ items: mockVersions })
    mockTransport.getVersion.mockResolvedValue(mockDetail)
    mockTransport.push.mockRejectedValue(new Error("push failed"))

    const { result } = renderHookWithQueryClient(() =>
      useVersionHistory({ writingId: 1, open: true })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.selectVersion(20)
    })

    await waitFor(() => {
      expect(result.current.selectedDetail).toEqual(mockDetail)
    })

    act(() => {
      result.current.restoreVersion(20)
    })

    await waitFor(() => {
      expect(result.current.error).toBe(
        "복원에 실패했습니다. 다시 시도해 주세요."
      )
    })
    expect(result.current.restoring).toBe(false)
  })

  it("retry로 에러를 초기화한다", async () => {
    mockTransport.listVersions
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({ items: mockVersions })

    const { result } = renderHookWithQueryClient(() =>
      useVersionHistory({ writingId: 1, open: true })
    )

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    act(() => {
      result.current.retry()
    })

    await waitFor(() => {
      expect(result.current.error).toBeNull()
    })
    expect(result.current.versions).toEqual(mockVersions)
  })
})
