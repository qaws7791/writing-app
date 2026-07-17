import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"

import { createUnavailableAiFeedbackProvider } from "@/adapters/ai-feedback/openai-feedback-provider"
import { createLearnerApiCore } from "@/learner-api-core"

describe("학습자 API 코어 조립", () => {
  it("주입된 in-memory database로 서비스를 조립한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      const core = createLearnerApiCore({
        aiFeedbackProvider: createUnavailableAiFeedbackProvider(),
        authBaseUrl: "http://localhost:4000",
        betterAuthSecret:
          "learner-api-core-test-secret-0123456789abcdef0123456789abcdef",
        cursorSigningSecret:
          "learner-api-core-cursor-0123456789abcdef0123456789abcdef",
        database: database.db,
        webOrigin: "http://localhost:3000",
      })

      expect(core.authHandler).toBeTypeOf("function")
      expect(core.learnerCursorCodec).toBeDefined()
      expect(core.learnerTransitionRepository).toBeDefined()
      expect(core).not.toHaveProperty("close")
    } finally {
      database.close()
    }
  })

  it("auth hook과 session resolver가 같은 profile repository instance를 사용한다", async () => {
    const source = await readFile(
      new URL("./learner-api-core.ts", import.meta.url),
      "utf8"
    )

    expect(source).toContain("profileRepository: learnerProfileRepository")
    expect(source).toContain("createDrizzleLearnerProfileRepository")
    expect(source).toContain("createDrizzleAiFeedbackRepository")
    expect(source).toContain("createDrizzleLearnerReadModelRepository")
    expect(source).toContain("createDrizzleProfileReader")
    expect(source).toContain("createDrizzleLearnerTransitionRepository")
    expect(source).toMatch(
      /createLearnerSessionResolver\(\s*auth,\s*learnerProfileRepository\s*\)/u
    )
  })

  it("production과 E2E가 같은 통합 runtime root를 사용한다", async () => {
    const [mainSource, e2eSource] = await Promise.all([
      readFile(new URL("./main.ts", import.meta.url), "utf8"),
      readFile(new URL("./scripts/start-e2e-api.ts", import.meta.url), "utf8"),
    ])

    expect(mainSource).toContain('from "@/api-runtime"')
    expect(mainSource).not.toContain('from "@/learner-api-core"')
    expect(mainSource).not.toContain("createWritingAppDatabase")
    expect(e2eSource).toContain('from "@/api-runtime"')
    expect(e2eSource).not.toContain('from "@/learner-api-core"')
    expect(e2eSource).not.toContain("createWritingAppDatabase")
    expect(e2eSource).not.toContain("@workspace/core/learner-api-core")
  })
})
