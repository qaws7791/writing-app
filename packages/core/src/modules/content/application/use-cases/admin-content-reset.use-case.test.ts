import { describe, expect, it, vi } from "vitest"

import type { AdminContentResetResultDto } from "@workspace/contracts/operations/content-reset-data"
import { adminIdSchema } from "@workspace/contracts/identity/data"
import type { ContentResetRepository } from "#core/modules/content/application/ports/admin-content.repository"
import { createAdminContentResetUseCase } from "#core/modules/content/application/use-cases/admin-content-reset.use-case"

const resetResult: AdminContentResetResultDto = {
  changed: {
    archived: 0,
    courses: 5,
    lessons: 44,
    steps: 136,
    units: 15,
  },
  revision: 1,
}

describe("content 소유 관리자 content reset use case", () => {
  it("owner command에서 actor를 제거하고 reset 결과를 반환한다", async () => {
    const repository = createContentResetRepository()
    const useCase = createAdminContentResetUseCase(repository)
    const now = new Date("2026-06-14T03:00:00.000Z")

    await expect(
      useCase.resetContent({
        actor: {
          id: adminIdSchema.parse("owner-1"),
          role: "owner",
        },
        now,
      })
    ).resolves.toEqual({ kind: "ok", value: resetResult })
    expect(repository.resetContent).toHaveBeenCalledWith({ now })
  })

  it("operator command를 repository 호출 전에 forbidden으로 거절한다", async () => {
    const repository = createContentResetRepository()
    const useCase = createAdminContentResetUseCase(repository)

    await expect(
      useCase.resetContent({
        actor: {
          id: adminIdSchema.parse("operator-1"),
          role: "operator",
        },
        now: new Date("2026-06-14T03:00:00.000Z"),
      })
    ).resolves.toEqual({ kind: "forbidden" })
    expect(repository.resetContent).not.toHaveBeenCalled()
  })
})

function createContentResetRepository(): ContentResetRepository & {
  readonly resetContent: ReturnType<
    typeof vi.fn<ContentResetRepository["resetContent"]>
  >
} {
  return {
    resetContent: vi.fn(async () => resetResult),
  }
}
