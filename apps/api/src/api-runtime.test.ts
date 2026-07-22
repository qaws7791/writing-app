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
    const contentDatabase = vi.fn()
    const identityDatabase = vi.fn()
    const resourceLibraryDatabase = vi.fn()

    try {
      const runtime = assembleApiRuntime({
        closeDatabase: database.close,
        createAdminAuth(db) {
          adminDatabase(db)
          return "admin-auth"
        },
        createAdminCapabilityRoutes({
          adminAuth,
          adminSessionResolver,
          content,
          database: db,
          identity,
          resourceLibrary,
        }) {
          capabilityDatabase(db)
          expect(adminAuth).toBe("admin-auth")
          expect(adminSessionResolver).toBe("admin-session-resolver")
          expect(content).toBe("content")
          expect(identity).toBe("identity")
          expect(resourceLibrary).toBe("resource-library")
          return "admin-capability-routes"
        },
        createAdminSessionResolver({ adminAuth, identity }) {
          expect(adminAuth).toBe("admin-auth")
          expect(identity).toBe("identity")
          return "admin-session-resolver"
        },
        createContent(db) {
          contentDatabase(db)
          return "content"
        },
        createIdentity({ content, database: db }) {
          expect(content).toBe("content")
          identityDatabase(db)
          return "identity"
        },
        createLearnerCore({ content, database: db, identity }) {
          learnerDatabase(db)
          expect(content).toBe("content")
          expect(identity).toBe("identity")
          return "learner-core"
        },
        createResourceLibrary(db) {
          resourceLibraryDatabase(db)
          return "resource-library"
        },
        database: database.db,
      })

      expect(runtime).toMatchObject({
        adminAuth: "admin-auth",
        adminCapabilityRoutes: "admin-capability-routes",
        adminSessionResolver: "admin-session-resolver",
        content: "content",
        identity: "identity",
        learnerCore: "learner-core",
        resourceLibrary: "resource-library",
      })
      expect(learnerDatabase).toHaveBeenCalledWith(database.db)
      expect(adminDatabase).toHaveBeenCalledWith(database.db)
      expect(identityDatabase).toHaveBeenCalledWith(database.db)
      expect(contentDatabase).toHaveBeenCalledWith(database.db)
      expect(resourceLibraryDatabase).toHaveBeenCalledWith(database.db)
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
      createAdminSessionResolver: () => ({}),
      createContent: () => ({}),
      createIdentity: () => ({}),
      createLearnerCore: () => ({}),
      createResourceLibrary: () => ({}),
      database: database.db,
    })

    runtime.dispose()
    runtime.dispose()

    expect(closeDatabase).toHaveBeenCalledTimes(1)
  })

  it.each([
    "content",
    "identity",
    "learner",
    "resource",
    "admin",
    "session",
    "capability",
  ] as const)(
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
          createAdminSessionResolver() {
            if (failurePoint === "session") throw new Error("session 실패")
            return {}
          },
          createContent() {
            if (failurePoint === "content") throw new Error("content 실패")
            return {}
          },
          createIdentity() {
            if (failurePoint === "identity") throw new Error("identity 실패")
            return {}
          },
          createLearnerCore() {
            if (failurePoint === "learner") throw new Error("learner 실패")
            return {}
          },
          createResourceLibrary() {
            if (failurePoint === "resource") {
              throw new Error("resource 실패")
            }
            return {}
          },
          database: database.db,
        })
      ).toThrow(`${failurePoint} 실패`)
      expect(closeDatabase).toHaveBeenCalledTimes(1)
    }
  )

  it("database client 생성은 production composition root 하나에만 둔다", async () => {
    const [runtimeSource, learnerSource, mainSource, authDatabaseSource] =
      await Promise.all([
        readFile(new URL("./api-runtime.ts", import.meta.url), "utf8"),
        readFile(new URL("./learner-api-core.ts", import.meta.url), "utf8"),
        readFile(new URL("./main.ts", import.meta.url), "utf8"),
        readFile(
          new URL("./adapters/auth/auth-sqlite-database.ts", import.meta.url),
          "utf8"
        ),
      ])

    expect(runtimeSource).toContain("createWritingAppDatabase")
    for (const source of [learnerSource, mainSource, authDatabaseSource]) {
      expect(source).not.toContain("createWritingAppDatabase")
    }
    expect(learnerSource).not.toContain("databaseUrl")
    expect(learnerSource).not.toMatch(/\bclose\b/u)
    expect(authDatabaseSource).not.toContain("WritingAppDatabaseClient")
  })
})
