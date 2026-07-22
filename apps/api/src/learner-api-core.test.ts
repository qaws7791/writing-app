import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { createIdentityModule } from "@workspace/identity/module"
import { ok } from "@workspace/kernel/result"
import { createUnavailableAiFeedbackProvider } from "@workspace/ai-feedback/provider"

import { createLearnerIdentityDirectory } from "@/adapters/auth/learner-identity-directory"
import { createLearnerApiCore } from "@/learner-api-core"

describe("학습자 API 코어 조립", () => {
  it("주입된 in-memory database로 서비스를 조립한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      const core = createLearnerApiCore({
        aiFeedbackModel: "test-model",
        aiFeedbackProvider: createUnavailableAiFeedbackProvider(),
        apiOrigin: "http://localhost:4000",
        learnerAuthSecret:
          "learner-api-core-test-secret-0123456789abcdef0123456789abcdef",
        cursorSigningSecret:
          "learner-api-core-cursor-0123456789abcdef0123456789abcdef",
        database: database.db,
        identity: createTestIdentity(database.db),
        sqlite: database.sqlite,
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

  it("auth runtime에 identity provisioning과 제품 세션 변환 경계를 주입한다", async () => {
    const source = await readFile(
      new URL("./learner-api-core.ts", import.meta.url),
      "utf8"
    )

    expect(source).toContain("identityProvisioner: createIdentityProvisioner")
    expect(source).toContain("composeAiFeedbackModule")
    expect(source).toContain("createDrizzleLearnerReadModelRepository")
    expect(source).toContain("createDrizzleProfileReader")
    expect(source).toContain("createDrizzleLearnerTransitionRepository")
    expect(source).toContain("createLearnerAuthDatabase(database)")
    expect(source).toContain("createLearnerTestAuthDisplayNameSynchronizer(")
    expect(source).toContain("createLearnerSessionResolver")
    expect(source).not.toContain("createDrizzleLearnerProfileRepository")
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

function createTestIdentity(
  database: Parameters<typeof createIdentityModule>[0]["database"]
) {
  return createIdentityModule({
    clock: { now: () => new Date("2026-07-18T00:00:00.000Z") },
    database,
    eventFailureObserver: () => undefined,
    eventIdGenerator: { next: () => "event-1" },
    eventPublisher: {
      publishUserStatusChanged: async () => ok(undefined),
    },
    learningReport: {
      readActiveLessonCount: async () => 0,
      readLearnerReports: async () => [],
    },
    learnerIdentityDirectory: createLearnerIdentityDirectory(database),
    sessionRevocation: {
      revokeAdminSessions: async () => ok(undefined),
      revokeLearnerSessions: async () => ok(undefined),
    },
  })
}
