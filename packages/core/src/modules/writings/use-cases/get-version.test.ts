import { describe, expect, it } from "vitest"

import { toWritingId, toUserId } from "../../../shared/brand/index"
import { makeGetVersionUseCase } from "./get-version"
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

  const getVersion = makeGetVersionUseCase({
    writingRepository,
    versionRepository,
  })

  return { getVersion, versionRepository }
}

describe("makeGetVersionUseCase", () => {
  it("특정 버전의 상세 정보를 반환한다", async () => {
    const { getVersion, versionRepository } = createDeps()

    await versionRepository.create({
      writingId,
      userId,
      version: 10,
      title: "버전 10 제목",
      content: testContent,
      createdAt: "2026-03-25T12:00:00.000Z",
      reason: "auto",
    })

    const result = await getVersion(userId, writingId, 10)

    expect(result.isOk()).toBe(true)
    const detail = result._unsafeUnwrap()
    expect(detail.version).toBe(10)
    expect(detail.title).toBe("버전 10 제목")
    expect(detail.content).toEqual(testContent)
    expect(detail.reason).toBe("auto")
  })

  it("존재하지 않는 버전이면 NOT_FOUND를 반환한다", async () => {
    const { getVersion } = createDeps()

    const result = await getVersion(userId, writingId, 99)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
    })
  })

  it("존재하지 않는 문서이면 NOT_FOUND를 반환한다", async () => {
    const { getVersion } = createDeps()

    const result = await getVersion(userId, toWritingId(999), 10)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
    })
  })

  it("다른 사용자의 문서이면 NOT_FOUND를 반환한다", async () => {
    const { getVersion } = createDeps()

    const result = await getVersion(toUserId("other-user"), writingId, 10)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
    })
  })
})
