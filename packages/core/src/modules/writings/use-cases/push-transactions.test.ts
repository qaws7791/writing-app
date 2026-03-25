import { describe, expect, it } from "vitest"

import { toDraftId, toUserId } from "../../../shared/brand/index"
import { makePushTransactionsUseCase } from "./push-transactions"
import {
  createFakeWritingRepository,
  createFakeTransactionRepository,
  createFakeVersionRepository,
} from "../testing/fake-writing-repositories"
import { createTestWriting, updatedContent } from "../testing/test-fixtures"

const userId = toUserId("user-1")
const draftId = toDraftId(1)
const now = "2026-03-25T12:00:00.000Z"

function createDeps(version = 1) {
  const writing = createTestWriting({ version, id: draftId, userId })
  const writingRepository = createFakeWritingRepository(writing)
  const transactionRepository = createFakeTransactionRepository()
  const versionRepository = createFakeVersionRepository()

  const pushTransactions = makePushTransactionsUseCase({
    writingRepository,
    transactionRepository,
    versionRepository,
    getNow: () => now,
  })

  return { pushTransactions, transactionRepository, versionRepository }
}

describe("makePushTransactionsUseCase", () => {
  it("빈 트랜잭션이면 VALIDATION_ERROR를 반환한다", async () => {
    const { pushTransactions } = createDeps()

    const result = await pushTransactions(userId, draftId, {
      baseVersion: 1,
      transactions: [],
    })

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "VALIDATION_ERROR",
    })
  })

  it("존재하지 않는 문서이면 NOT_FOUND를 반환한다", async () => {
    const { pushTransactions } = createDeps()

    const result = await pushTransactions(userId, toDraftId(999), {
      baseVersion: 1,
      transactions: [
        {
          operations: [{ type: "setTitle", title: "새 제목" }],
          createdAt: now,
        },
      ],
    })

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
    })
  })

  it("baseVersion 불일치 시 conflict를 반환한다", async () => {
    const { pushTransactions } = createDeps(5)

    const result = await pushTransactions(userId, draftId, {
      baseVersion: 3,
      transactions: [
        {
          operations: [{ type: "setTitle", title: "새 제목" }],
          createdAt: now,
        },
      ],
    })

    expect(result.isOk()).toBe(true)
    const value = result._unsafeUnwrap()
    expect(value.accepted).toBe(false)
    if (!value.accepted) {
      expect(value.serverVersion).toBe(5)
    }
  })

  it("정상 push 시 accepted를 반환한다", async () => {
    const { pushTransactions, transactionRepository } = createDeps(1)

    const result = await pushTransactions(userId, draftId, {
      baseVersion: 1,
      transactions: [
        {
          operations: [{ type: "setTitle", title: "새 제목" }],
          createdAt: now,
        },
      ],
    })

    expect(result.isOk()).toBe(true)
    const value = result._unsafeUnwrap()
    expect(value.accepted).toBe(true)
    if (value.accepted) {
      expect(value.serverVersion).toBe(2)
    }

    expect(transactionRepository.getAll()).toHaveLength(1)
  })

  it("여러 트랜잭션을 순차 적용한다", async () => {
    const { pushTransactions, transactionRepository } = createDeps(1)

    const result = await pushTransactions(userId, draftId, {
      baseVersion: 1,
      transactions: [
        {
          operations: [{ type: "setTitle", title: "제목 1" }],
          createdAt: now,
        },
        {
          operations: [{ type: "setContent", content: updatedContent }],
          createdAt: now,
        },
      ],
    })

    expect(result.isOk()).toBe(true)
    const value = result._unsafeUnwrap()
    expect(value.accepted).toBe(true)
    if (value.accepted) {
      expect(value.serverVersion).toBe(3)
    }

    expect(transactionRepository.getAll()).toHaveLength(2)
  })

  it("10 버전마다 자동 스냅샷을 생성한다", async () => {
    const { pushTransactions, versionRepository } = createDeps(9)

    const result = await pushTransactions(userId, draftId, {
      baseVersion: 9,
      transactions: [
        {
          operations: [{ type: "setTitle", title: "v10 제목" }],
          createdAt: now,
        },
      ],
    })

    expect(result.isOk()).toBe(true)
    const snapshots = versionRepository.getAll()
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0]!.version).toBe(10)
    expect(snapshots[0]!.reason).toBe("auto")
  })

  it("restoreFrom이 있으면 restore 스냅샷을 생성한다", async () => {
    const { pushTransactions, versionRepository } = createDeps(3)

    const result = await pushTransactions(userId, draftId, {
      baseVersion: 3,
      transactions: [
        {
          operations: [
            { type: "setTitle", title: "복원된 제목" },
            { type: "setContent", content: updatedContent },
          ],
          createdAt: now,
        },
      ],
      restoreFrom: 1,
    })

    expect(result.isOk()).toBe(true)
    const snapshots = versionRepository.getAll()
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0]!.reason).toBe("restore")
  })

  it("snapshotReason이 manual이면 수동 스냅샷을 생성한다", async () => {
    const { pushTransactions, versionRepository } = createDeps(2)

    const result = await pushTransactions(userId, draftId, {
      baseVersion: 2,
      transactions: [
        {
          operations: [{ type: "setTitle", title: "수동 저장" }],
          createdAt: now,
        },
      ],
      snapshotReason: "manual",
    })

    expect(result.isOk()).toBe(true)
    const snapshots = versionRepository.getAll()
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0]!.reason).toBe("manual")
  })

  it("스냅샷 조건에 해당하지 않으면 스냅샷을 생성하지 않는다", async () => {
    const { pushTransactions, versionRepository } = createDeps(2)

    await pushTransactions(userId, draftId, {
      baseVersion: 2,
      transactions: [
        {
          operations: [{ type: "setTitle", title: "일반 변경" }],
          createdAt: now,
        },
      ],
    })

    expect(versionRepository.getAll()).toHaveLength(0)
  })
})
