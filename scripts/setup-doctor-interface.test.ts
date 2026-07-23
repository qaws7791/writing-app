import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { describe, expect, test } from "bun:test"

import {
  createLocalSetupOperationLockPath,
  rehearseLocalDatabaseMigration,
  runLocalDatabaseSetup,
  withLocalSetupOperationLock,
} from "#scripts/local-database-setup"

describe("setup과 doctor DB 안전 경계", () => {
  test("migration 필요 DB는 진단·검증 백업 뒤에만 migration을 실행한다", async () => {
    const events: string[] = []

    await runLocalDatabaseSetup({
      backup: async () => {
        events.push("backup")
        return "recovery.sqlite"
      },
      databaseExists: () => {
        events.push("exists")
        return true
      },
      inspect: async () => {
        events.push("inspect")
        return {
          legacySchema: "curriculum",
          schema: "legacy",
          status: "migration-required",
        }
      },
      migrateAndSeed: async () => {
        events.push("migrate")
      },
      rehearseMigration: async (backupPath) => {
        expect(backupPath).toBe("recovery.sqlite")
        events.push("rehearse")
      },
    })

    expect(events).toEqual([
      "exists",
      "inspect",
      "backup",
      "rehearse",
      "migrate",
    ])
  })

  test("backup 실패와 blocked 진단에서는 rehearsal과 실제 migration을 실행하지 않는다", async () => {
    const migration = { count: 0 }
    const rehearsal = { count: 0 }
    const migrateAndSeed = async () => {
      migration.count += 1
    }
    const rehearseMigration = async () => {
      rehearsal.count += 1
    }

    await expect(
      runLocalDatabaseSetup({
        backup: async () => {
          throw new Error("backup failed")
        },
        databaseExists: () => true,
        inspect: async () => ({
          pendingMigrationIds: ["0001-module-schema-ownership"],
          schema: "current",
          status: "migration-required",
        }),
        migrateAndSeed,
        rehearseMigration,
      })
    ).rejects.toThrow("backup failed")
    await expect(
      runLocalDatabaseSetup({
        backup: async () => "recovery.sqlite",
        databaseExists: () => true,
        inspect: async () => ({
          reason: "unknown schema",
          schema: "unsupported",
          status: "blocked",
        }),
        migrateAndSeed,
        rehearseMigration,
      })
    ).rejects.toThrow("기존 DB가 지원하지 않는 상태")
    expect(migration.count).toBe(0)
    expect(rehearsal.count).toBe(0)
  })

  test("사본 migration이나 reconcile 실패 시 실제 migration을 실행하지 않는다", async () => {
    const actualMigration = { count: 0 }

    await expect(
      runLocalDatabaseSetup({
        backup: async () => "recovery.sqlite",
        databaseExists: () => true,
        inspect: async () => ({
          pendingMigrationIds: ["0001-module-schema-ownership"],
          schema: "current",
          status: "migration-required",
        }),
        migrateAndSeed: async () => {
          actualMigration.count += 1
        },
        rehearseMigration: async () => {
          throw new Error("candidate reconcile failed")
        },
      })
    ).rejects.toThrow("candidate reconcile failed")

    expect(actualMigration.count).toBe(0)
  })

  test("새 DB와 current DB는 불필요한 backup 없이 setup한다", async () => {
    const events: string[] = []
    const backup = async () => {
      events.push("backup")
      return "recovery.sqlite"
    }
    const migrateAndSeed = async () => {
      events.push("migrate")
    }

    await runLocalDatabaseSetup({
      backup,
      databaseExists: () => false,
      inspect: async () => {
        throw new Error("새 DB를 진단하면 안 됩니다.")
      },
      migrateAndSeed,
      rehearseMigration: async () => {
        events.push("rehearse")
      },
    })
    await runLocalDatabaseSetup({
      backup,
      databaseExists: () => true,
      inspect: async () => {
        events.push("inspect")
        return { schema: "current", status: "ok" }
      },
      migrateAndSeed,
      rehearseMigration: async () => {
        events.push("rehearse")
      },
    })

    expect(events).toEqual(["migrate", "inspect", "migrate"])
  })

  test("recovery backup은 보존하고 격리 candidate만 migration한 뒤 정리한다", async () => {
    using fixture = createTemporaryFixture()
    const backupPath = path.join(fixture.path, "recovery.sqlite")
    const recoveryBytes = Buffer.from("recovery-backup")
    fs.writeFileSync(backupPath, recoveryBytes)
    let candidatePath = ""

    await rehearseLocalDatabaseMigration({
      backupPath,
      inspectCandidate: async (pathToInspect) => {
        expect(pathToInspect).toBe(candidatePath)
        expect(fs.readFileSync(pathToInspect, "utf8")).toBe(
          "candidate-migrated"
        )
        return { schema: "current", status: "ok" }
      },
      migrateCandidate: async (pathToMigrate) => {
        candidatePath = pathToMigrate
        expect(pathToMigrate).not.toBe(backupPath)
        fs.writeFileSync(pathToMigrate, "candidate-migrated")
      },
    })

    expect(fs.readFileSync(backupPath)).toEqual(recoveryBytes)
    expect(candidatePath).not.toBe("")
    expect(fs.existsSync(candidatePath)).toBe(false)
  })

  test("candidate 진단 실패도 임시 사본만 정리하고 recovery backup을 보존한다", async () => {
    using fixture = createTemporaryFixture()
    const backupPath = path.join(fixture.path, "recovery.sqlite")
    const recoveryBytes = Buffer.from("recovery-backup")
    fs.writeFileSync(backupPath, recoveryBytes)
    let candidatePath = ""

    await expect(
      rehearseLocalDatabaseMigration({
        backupPath,
        inspectCandidate: async () => ({
          pendingMigrationIds: ["0001-module-schema-ownership"],
          schema: "current",
          status: "migration-required",
        }),
        migrateCandidate: async (pathToMigrate) => {
          candidatePath = pathToMigrate
          fs.writeFileSync(pathToMigrate, "candidate-migrated")
        },
      })
    ).rejects.toThrow("current/ok")

    expect(fs.readFileSync(backupPath)).toEqual(recoveryBytes)
    expect(candidatePath).not.toBe("")
    expect(fs.existsSync(candidatePath)).toBe(false)
  })

  test("operation lock은 동시 setup을 차단하고 실패 뒤 정리된다", async () => {
    using fixture = createTemporaryFixture()
    const lockPath = createLocalSetupOperationLockPath(fixture.path)

    await expect(
      withLocalSetupOperationLock(fixture.path, async () => {
        expect(fs.existsSync(lockPath)).toBe(true)
        await expect(
          withLocalSetupOperationLock(fixture.path, async () => undefined)
        ).rejects.toThrow("operation lock이 이미 있습니다")
        throw new Error("candidate migration failed")
      })
    ).rejects.toThrow("candidate migration failed")

    expect(fs.existsSync(lockPath)).toBe(false)
    await expect(
      withLocalSetupOperationLock(fixture.path, async () => "reacquired")
    ).resolves.toBe("reacquired")
    expect(fs.existsSync(lockPath)).toBe(false)
  })

  test("operation lock 소유권이 바뀌면 자동 삭제하지 않고 원래 실패와 함께 보고한다", async () => {
    using fixture = createTemporaryFixture()
    const lockPath = createLocalSetupOperationLockPath(fixture.path)
    const ownerPath = path.join(lockPath, "owner.json")

    await expect(
      withLocalSetupOperationLock(fixture.path, async () => {
        fs.writeFileSync(ownerPath, "replaced-lock")
        throw new Error("setup operation failed")
      })
    ).rejects.toThrow("operation lock 정리에도 실패")
    expect(fs.readFileSync(ownerPath, "utf8")).toBe("replaced-lock")
  })

  test("기존 stale operation lock은 자동 삭제하거나 덮어쓰지 않는다", async () => {
    using fixture = createTemporaryFixture()
    const lockPath = createLocalSetupOperationLockPath(fixture.path)
    const ownerPath = path.join(lockPath, "owner.json")
    fs.mkdirSync(lockPath)
    fs.writeFileSync(ownerPath, "stale-lock")

    await expect(
      withLocalSetupOperationLock(fixture.path, async () => {
        throw new Error("stale lock에서 실행하면 안 됩니다.")
      })
    ).rejects.toThrow("operation lock이 이미 있습니다")
    expect(fs.readFileSync(ownerPath, "utf8")).toBe("stale-lock")
  })

  test("database 존재 여부는 operation lock 안에서 최신 상태를 읽는다", async () => {
    using fixture = createTemporaryFixture()
    const databasePath = path.join(fixture.path, "api.sqlite")
    const events: string[] = []

    await withLocalSetupOperationLock(fixture.path, async () => {
      fs.writeFileSync(databasePath, "created-after-lock")
      await runLocalDatabaseSetup({
        backup: async () => {
          events.push("backup")
          return "recovery.sqlite"
        },
        databaseExists: () => {
          events.push("exists")
          return fs.existsSync(databasePath)
        },
        inspect: async () => {
          events.push("inspect")
          return { schema: "empty", status: "migration-required" }
        },
        migrateAndSeed: async () => {
          events.push("migrate")
        },
        rehearseMigration: async () => {
          events.push("rehearse")
        },
      })
    })

    expect(events).toEqual([
      "exists",
      "inspect",
      "backup",
      "rehearse",
      "migrate",
    ])
  })

  test("doctor는 workspace 계약과 read-only DB 진단만 실행한다", () => {
    const repositoryRoot = path.resolve(import.meta.dir, "..")
    const source = fs.readFileSync(
      path.join(repositoryRoot, "scripts/doctor.ts"),
      "utf8"
    )

    expect(source).toContain("check:workspace-inventory")
    expect(source).toContain("check:workspace-dependency-versions")
    expect(source).toContain("inspectLocalApplicationDatabase")
    expect(source).toContain('diagnostic.status === "migration-required"')
    expect(source).not.toContain("db:migrate")
    expect(source).not.toContain("db:reset")
  })

  test("setup은 전체 operation lock 안에서 candidate와 실제 migration entrypoint를 연결한다", () => {
    const repositoryRoot = path.resolve(import.meta.dir, "..")
    const setupSource = fs.readFileSync(
      path.join(repositoryRoot, "scripts/setup.ts"),
      "utf8"
    )
    const databaseSetupSource = fs.readFileSync(
      path.join(repositoryRoot, "scripts/local-database-setup.ts"),
      "utf8"
    )

    expect(setupSource).toContain(
      "withLocalSetupOperationLock(repositoryRoot, runSetupExclusively)"
    )
    expect(setupSource).toContain(
      '["bun", "--filter", "@workspace/api", "db:migrate"]'
    )
    expect(databaseSetupSource).toContain(
      'diagnostic.schema !== "current" || diagnostic.status !== "ok"'
    )
    expect(setupSource).not.toContain("statSync(databasePath)")
  })
})

function createTemporaryFixture(): Disposable & { readonly path: string } {
  const fixturePath = fs.mkdtempSync(
    path.join(os.tmpdir(), "local-database-setup-")
  )
  return {
    path: fixturePath,
    [Symbol.dispose]() {
      fs.rmSync(fixturePath, { force: true, recursive: true })
    },
  }
}
