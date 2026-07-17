import { readFile } from "node:fs/promises"
import { describe, expect, it, vi } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"

import { assembleApiRuntime } from "@/api-runtime"

describe("통합 API runtime composition root", () => {
  it("학습자 core와 관리자 auth에 같은 database instance를 주입한다", () => {
    const database = createInMemoryWritingAppDatabase()
    const learnerDatabase = vi.fn()
    const adminDatabase = vi.fn()
    const capabilityDatabase = vi.fn()

    try {
      const runtime = assembleApiRuntime({
        closeDatabase: database.close,
        createAdminAuth(db) {
          adminDatabase(db)
          return "admin-auth"
        },
        createAdminCapabilityRoutes({ adminAuth, database: db }) {
          capabilityDatabase(db)
          expect(adminAuth).toBe("admin-auth")
          return "admin-capability-routes"
        },
        createLearnerCore(db) {
          learnerDatabase(db)
          return "learner-core"
        },
        database: database.db,
      })

      expect(runtime).toMatchObject({
        adminAuth: "admin-auth",
        adminCapabilityRoutes: "admin-capability-routes",
        learnerCore: "learner-core",
      })
      expect(learnerDatabase).toHaveBeenCalledWith(database.db)
      expect(adminDatabase).toHaveBeenCalledWith(database.db)
      expect(learnerDatabase.mock.calls[0]?.[0]).toBe(
        adminDatabase.mock.calls[0]?.[0]
      )
      expect(capabilityDatabase).toHaveBeenCalledWith(database.db)
    } finally {
      database.close()
    }
  })

  it("dispose가 반복되어도 database를 한 번만 닫는다", () => {
    const database = createInMemoryWritingAppDatabase()
    const closeDatabase = vi.fn(database.close)
    const runtime = assembleApiRuntime({
      closeDatabase,
      createAdminAuth: () => ({}),
      createAdminCapabilityRoutes: () => [],
      createLearnerCore: () => ({}),
      database: database.db,
    })

    runtime.dispose()
    runtime.dispose()

    expect(closeDatabase).toHaveBeenCalledTimes(1)
  })

  it.each(["learner", "admin", "capability"] as const)(
    "%s 조립이 실패하면 database를 한 번만 닫는다",
    (failurePoint) => {
      const database = createInMemoryWritingAppDatabase()
      const closeDatabase = vi.fn(database.close)

      expect(() =>
        assembleApiRuntime({
          closeDatabase,
          createAdminAuth() {
            if (failurePoint === "admin") throw new Error("admin 실패")
            return {}
          },
          createAdminCapabilityRoutes() {
            if (failurePoint === "capability") {
              throw new Error("capability 실패")
            }
            return []
          },
          createLearnerCore() {
            if (failurePoint === "learner") throw new Error("learner 실패")
            return {}
          },
          database: database.db,
        })
      ).toThrow(`${failurePoint} 실패`)
      expect(closeDatabase).toHaveBeenCalledTimes(1)
    }
  )

  it("database client 생성은 production composition root 하나에만 둔다", async () => {
    const [runtimeSource, learnerSource, mainSource, adminAuthSource] =
      await Promise.all([
        readFile(new URL("./api-runtime.ts", import.meta.url), "utf8"),
        readFile(new URL("./learner-api-core.ts", import.meta.url), "utf8"),
        readFile(new URL("./main.ts", import.meta.url), "utf8"),
        readFile(
          new URL("./adapters/auth/admin-auth.ts", import.meta.url),
          "utf8"
        ),
      ])

    expect(runtimeSource).toContain("createWritingAppDatabase")
    for (const source of [learnerSource, mainSource, adminAuthSource]) {
      expect(source).not.toContain("createWritingAppDatabase")
    }
    expect(learnerSource).not.toContain("databaseUrl")
    expect(learnerSource).not.toMatch(/\bclose\b/u)
    expect(adminAuthSource).not.toContain("WritingAppDatabaseClient")
  })
})
