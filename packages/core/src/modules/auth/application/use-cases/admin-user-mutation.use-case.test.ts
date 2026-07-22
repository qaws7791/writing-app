import { describe, expect, it, vi } from "vitest"

import {
  adminIdSchema,
  userIdSchema,
  type AdminUserDetailDto,
} from "@workspace/contracts/identity/data"

import type { AdminUserMutationRepository } from "#core/modules/auth/application/ports/admin-user-mutation.repository"
import { createAdminUserMutationUseCase } from "#core/modules/auth/application/use-cases/admin-user-mutation.use-case"

const now = new Date("2026-06-14T03:00:00.000Z")
const userId = userIdSchema.parse("user-1")
const ownerActor = {
  id: adminIdSchema.parse("owner-1"),
  role: "owner",
} as const
const operatorActor = {
  id: adminIdSchema.parse("operator-1"),
  role: "operator",
} as const
const user: AdminUserDetailDto = {
  email: "learner@example.com",
  id: userId,
  joined: "2026-06-14",
  lastActive: null,
  lessonsDone: 0,
  name: "학습자",
  progressPercent: 0,
  status: "suspended",
  streak: 0,
  totalLessons: 0,
}

describe("관리자 identity 사용자 mutation use case", () => {
  it("owner의 상태 변경과 soft-delete 입력에서 actor를 제거하고 결과를 보존한다", async () => {
    const repository = createUserMutationRepository()
    const useCase = createAdminUserMutationUseCase(repository)

    await expect(
      useCase.updateUserStatus({
        actor: ownerActor,
        now,
        status: "suspended",
        userId,
      })
    ).resolves.toEqual({ kind: "ok", value: user })
    await expect(
      useCase.deleteUser({ actor: ownerActor, now, userId })
    ).resolves.toEqual({ kind: "ok" })

    expect(repository.updateUserStatus).toHaveBeenCalledWith({
      now,
      status: "suspended",
      userId,
    })
    expect(repository.deleteUser).toHaveBeenCalledWith({ now, userId })
  })

  it("상태 변경과 soft-delete의 not-found 결과를 그대로 반환한다", async () => {
    const repository = createUserMutationRepository({
      deleteResult: { kind: "not-found" },
      updateResult: { kind: "not-found" },
    })
    const useCase = createAdminUserMutationUseCase(repository)

    await expect(
      useCase.updateUserStatus({
        actor: ownerActor,
        now,
        status: "active",
        userId,
      })
    ).resolves.toEqual({ kind: "not-found" })
    await expect(
      useCase.deleteUser({ actor: ownerActor, now, userId })
    ).resolves.toEqual({ kind: "not-found" })
  })

  it("operator의 직접 호출은 mutation repository 실행 전에 거절한다", async () => {
    const repository = createUserMutationRepository()
    const useCase = createAdminUserMutationUseCase(repository)

    await expect(
      useCase.updateUserStatus({
        actor: operatorActor,
        now,
        status: "suspended",
        userId,
      })
    ).resolves.toEqual({ kind: "forbidden" })
    await expect(
      useCase.deleteUser({ actor: operatorActor, now, userId })
    ).resolves.toEqual({ kind: "forbidden" })

    expect(repository.updateUserStatus).not.toHaveBeenCalled()
    expect(repository.deleteUser).not.toHaveBeenCalled()
  })
})

function createUserMutationRepository({
  deleteResult = { kind: "ok" },
  updateResult = { kind: "ok", value: user },
}: {
  readonly deleteResult?: Awaited<
    ReturnType<AdminUserMutationRepository["deleteUser"]>
  >
  readonly updateResult?: Awaited<
    ReturnType<AdminUserMutationRepository["updateUserStatus"]>
  >
} = {}): AdminUserMutationRepository & {
  readonly deleteUser: ReturnType<
    typeof vi.fn<AdminUserMutationRepository["deleteUser"]>
  >
  readonly updateUserStatus: ReturnType<
    typeof vi.fn<AdminUserMutationRepository["updateUserStatus"]>
  >
} {
  return {
    deleteUser: vi.fn(async () => deleteResult),
    updateUserStatus: vi.fn(async () => updateResult),
  }
}
