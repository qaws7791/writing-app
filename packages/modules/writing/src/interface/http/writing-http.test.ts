import { describe, expect, it } from "vitest"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import { writingIdSchema } from "@workspace/contracts/writing/writing"
import { createApp } from "@workspace/http-platform/app"
import { err, ok } from "@workspace/kernel/result"

import type { WritingApplication } from "#writing/application/ports/writing-ports"
import type { Writing } from "#writing/domain/writing"
import {
  registerWritingRoutes,
  type WritingHonoEnv,
} from "#writing/interface/http/writing-routes"

const learnerId = learnerIdSchema.parse("learner-1")
const writingId = writingIdSchema.parse("writing-1")
const writing: Writing = {
  body: "본문",
  checkedAt: null,
  createdAt: new Date("2026-08-08T00:00:00.000Z"),
  id: writingId,
  learnerId,
  mode: "free",
  selfCheckStartedAt: null,
  status: "drafting",
  title: "제목",
  updatedAt: new Date("2026-08-08T00:00:00.000Z"),
  version: 1,
}
const activeHeaders = { Cookie: "learner=active" } as const

describe("writing HTTP interface", () => {
  it("인증되지 않은 글 조회를 private 401로 거절한다", async () => {
    const response = await createWritingHttpFixture().request("/writings")

    expect(response.status).toBe(401)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
  })

  it("active 학습자에게 원문 없는 글 목록을 반환한다", async () => {
    const response = await createWritingHttpFixture().request("/writings", {
      headers: activeHeaders,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    await expect(response.json()).resolves.toEqual({
      items: [
        {
          id: "writing-1",
          mode: "free",
          status: "drafting",
          title: "제목",
          updatedAt: "2026-08-08T00:00:00.000Z",
          version: 1,
        },
      ],
    })
  })

  it("저장 version 충돌을 canonical 409로 반환한다", async () => {
    const response = await createWritingHttpFixture({ conflict: true }).request(
      "/writings/writing-1",
      {
        body: JSON.stringify({
          body: "로컬 본문",
          expectedVersion: 0,
          title: "로컬 제목",
        }),
        headers: {
          ...activeHeaders,
          "Content-Type": "application/json",
        },
        method: "PUT",
      }
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      code: "WRITING_VERSION_CONFLICT",
    })
  })

  it("점검 시작 전 완료 요청을 canonical 409로 반환한다", async () => {
    const response = await createWritingHttpFixture({
      selfCheckNotStarted: true,
    }).request("/writings/writing-1/self-check/complete", {
      body: JSON.stringify({ expectedVersion: 1 }),
      headers: {
        ...activeHeaders,
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      code: "WRITING_SELF_CHECK_NOT_STARTED",
    })
  })
})

function createWritingHttpFixture(
  input: Readonly<{
    conflict?: boolean
    selfCheckNotStarted?: boolean
  }> = {}
) {
  const application: WritingApplication = {
    async completeSelfCheck() {
      return input.selfCheckNotStarted === true
        ? err({ kind: "writing-self-check-not-started" })
        : ok(writing)
    },
    async create() {
      return writing
    },
    async delete() {
      return ok(writingId)
    },
    async get() {
      return ok(writing)
    },
    async list() {
      return [writing]
    },
    async save() {
      return input.conflict === true
        ? err({ kind: "writing-version-conflict" })
        : ok(writing)
    },
    async startSelfCheck() {
      return ok(writing)
    },
  }
  const app = createApp<WritingHonoEnv>()
  registerWritingRoutes(app, {
    application,
    session: {
      async resolveLearner(headers) {
        if (headers.get("Cookie") === activeHeaders.Cookie) {
          return { kind: "active", learnerId }
        }
        if (headers.get("Cookie") === "learner=inactive") {
          return { kind: "inactive", learnerId }
        }
        return null
      },
    },
  })
  return app
}
