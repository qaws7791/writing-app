import { describe, expect, it } from "vitest"

import { toWritingId, toUserId } from "../../../shared/brand/index"
import { makeListVersionsUseCase } from "./list-versions"
import {
  createFakeWritingSyncRepository,
  createFakeVersionRepository,
} from "../testing/fake-writing-repositories"
import { createTestWriting, testContent } from "../testing/test-fixtures"

const userId = toUserId("user-1")
const writingId = toWritingId(1)

function createDeps() {
  const writing = createTestWriting({ id: writingId, userId })
  const writingRepository = createFakeWritingSyncRepository(writing)
  const versionRepository = createFakeVersionRepository()

  const listVersions = makeListVersionsUseCase({
    writingRepository,
    versionRepository,
  })

  return { listVersions, versionRepository }
}

describe("makeListVersionsUseCase", () => {
  it("버전이 없으면 빈 배열을 반환한다", async () => {
    const { listVersions } = createDeps()

    const result = await listVersions(userId, writingId)

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toEqual([])
  })

  it("저장된 버전 목록을 반환한다", async () => {
    const { listVersions, versionRepository } = createDeps()

    await versionRepository.create({
      writingId,
      userId,
      version: 10,
      title: "버전 10",
      content: testContent,
      createdAt: "2026-03-25T12:00:00.000Z",
      reason: "auto",
    })

    await versionRepository.create({
      writingId,
      userId,
      version: 20,
      title: "버전 20",
      content: testContent,
      createdAt: "2026-03-25T13:00:00.000Z",
      reason: "auto",
    })

    const result = await listVersions(userId, writingId)

    expect(result.isOk()).toBe(true)
    const versions = result._unsafeUnwrap()
    expect(versions).toHaveLength(2)
    expect(versions[0]!.version).toBe(20)
    expect(versions[1]!.version).toBe(10)
  })

  it("limit을 적용할 수 있다", async () => {
    const { listVersions, versionRepository } = createDeps()

    for (let i = 1; i <= 3; i++) {
      await versionRepository.create({
        writingId,
        userId,
        version: i * 10,
        title: `버전 ${i * 10}`,
        content: testContent,
        createdAt: `2026-03-25T1${i}:00:00.000Z`,
        reason: "auto",
      })
    }

    const result = await listVersions(userId, writingId, 2)

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toHaveLength(2)
  })

  it("존재하지 않는 문서이면 NOT_FOUND를 반환한다", async () => {
    const { listVersions } = createDeps()

    const result = await listVersions(userId, toWritingId(999))

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
    })
  })

  it("다른 사용자의 문서이면 FORBIDDEN을 반환한다", async () => {
    const { listVersions } = createDeps()

    const result = await listVersions(toUserId("other-user"), writingId)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
    })
  })
})
