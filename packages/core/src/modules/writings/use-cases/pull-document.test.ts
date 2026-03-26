import { describe, expect, it } from "vitest"

import { toWritingId, toUserId } from "../../../shared/brand/index"
import { makePullDocumentUseCase } from "./pull-document"
import { createFakeWritingSyncRepository } from "../testing/fake-writing-repositories"
import { createTestWriting } from "../testing/test-fixtures"

const userId = toUserId("user-1")
const writingId = toWritingId(1)

function createDeps(version = 1) {
  const writing = createTestWriting({ id: writingId, userId, version })
  const writingRepository = createFakeWritingSyncRepository(writing)

  const pullDocument = makePullDocumentUseCase({ writingRepository })

  return { pullDocument }
}

describe("makePullDocumentUseCase", () => {
  it("현재 문서 상태를 반환한다", async () => {
    const { pullDocument } = createDeps(5)

    const result = await pullDocument(userId, writingId)

    expect(result.isOk()).toBe(true)
    const doc = result._unsafeUnwrap()
    expect(doc.version).toBe(5)
    expect(doc.hasNewerVersion).toBe(false)
  })

  it("sinceVersion보다 서버 버전이 높으면 hasNewerVersion이 true이다", async () => {
    const { pullDocument } = createDeps(5)

    const result = await pullDocument(userId, writingId, 3)

    expect(result.isOk()).toBe(true)
    const doc = result._unsafeUnwrap()
    expect(doc.hasNewerVersion).toBe(true)
  })

  it("sinceVersion과 서버 버전이 같으면 hasNewerVersion이 false이다", async () => {
    const { pullDocument } = createDeps(5)

    const result = await pullDocument(userId, writingId, 5)

    expect(result.isOk()).toBe(true)
    const doc = result._unsafeUnwrap()
    expect(doc.hasNewerVersion).toBe(false)
  })

  it("존재하지 않는 문서이면 NOT_FOUND를 반환한다", async () => {
    const { pullDocument } = createDeps()

    const result = await pullDocument(userId, toWritingId(999))

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
    })
  })

  it("다른 사용자의 문서이면 NOT_FOUND를 반환한다", async () => {
    const { pullDocument } = createDeps()

    const result = await pullDocument(toUserId("other-user"), writingId)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "NOT_FOUND",
    })
  })
})
