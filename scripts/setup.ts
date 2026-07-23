import { chmodSync, existsSync, mkdirSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

import {
  createSetupDatabaseBackupPath,
  inspectLocalApplicationDatabase,
} from "#scripts/local-database-diagnostic"
import {
  rehearseLocalDatabaseMigration,
  runLocalDatabaseSetup,
  withLocalSetupOperationLock,
} from "#scripts/local-database-setup"
import {
  createLocalSetupEnvironment,
  createLocalEnvironmentFiles,
  hasLocalOnboardingFailures,
  inspectLocalOnboarding,
  prepareLocalDatabaseDirectory,
  printLocalOnboardingChecks,
  resolveLocalDatabasePath,
} from "#scripts/local-onboarding"

const repositoryRoot = path.resolve(import.meta.dir, "..")

async function runSetup(): Promise<void> {
  await withLocalSetupOperationLock(repositoryRoot, runSetupExclusively)
}

async function runSetupExclusively(): Promise<void> {
  await runCommand(["bun", "run", "check:toolchain"])
  await runCommand(["bun", "install", "--frozen-lockfile"])
  await runCommand(["bun", "run", "check:workspace-inventory"])
  await runCommand(["bun", "run", "check:workspace-dependency-versions"])

  const files = createLocalEnvironmentFiles({ repositoryRoot })
  for (const file of files) {
    const action =
      file.kind === "created"
        ? "생성"
        : file.kind === "updated"
          ? "보충"
          : "보존"
    console.log(`- ${action}: ${file.path}`)
  }

  const preflight = inspectLocalOnboarding({
    bunVersion: Bun.version,
    nodeVersion: process.versions.node,
    repositoryRoot,
    requireDatabase: false,
  })
  printLocalOnboardingChecks(preflight)
  if (hasLocalOnboardingFailures(preflight)) {
    throw new Error("로컬 환경 사전 점검에 실패했습니다.")
  }

  const setupEnvironment = createLocalSetupEnvironment(
    repositoryRoot,
    process.env
  )
  const databaseDirectory = prepareLocalDatabaseDirectory(
    repositoryRoot,
    setupEnvironment.databaseUrl
  )
  console.log(`- 준비: ${databaseDirectory} database 디렉터리`)

  const databasePath = resolveLocalDatabasePath(
    repositoryRoot,
    setupEnvironment.databaseUrl
  )
  if (databasePath === null) {
    throw new Error(
      "로컬 setup은 file-backed SQLite DATABASE_URL이 필요합니다."
    )
  }

  await runLocalDatabaseSetup({
    async backup() {
      const backupPath = createSetupDatabaseBackupPath(repositoryRoot)
      const backupDirectory = path.dirname(backupPath)
      mkdirSync(backupDirectory, { mode: 0o700, recursive: true })
      chmodSync(backupDirectory, 0o700)
      await runCommand(
        [
          "bun",
          "apps/api/src/scripts/backup-database.ts",
          `--source=${databasePath}`,
          `--output=${backupPath}`,
        ],
        setupEnvironment.processEnvironment
      )
      console.log(
        `- 검증된 migration 전 백업: ${path.relative(repositoryRoot, backupPath)}`
      )
      return backupPath
    },
    databaseExists: () => existsSync(databasePath),
    inspect: () =>
      inspectLocalApplicationDatabase({
        environment: setupEnvironment.processEnvironment,
        repositoryRoot,
      }),
    migrateAndSeed: () =>
      runCommand(
        ["bun", "run", "dev:admin:setup"],
        setupEnvironment.processEnvironment
      ),
    async rehearseMigration(backupPath) {
      await rehearseLocalDatabaseMigration({
        backupPath,
        inspectCandidate: (candidatePath) =>
          inspectLocalApplicationDatabase({
            environment: createCandidateDatabaseEnvironment(
              setupEnvironment.processEnvironment,
              candidatePath
            ),
            repositoryRoot,
          }),
        migrateCandidate: (candidatePath) =>
          runCommand(
            ["bun", "--filter", "@workspace/api", "db:migrate"],
            createCandidateDatabaseEnvironment(
              setupEnvironment.processEnvironment,
              candidatePath
            )
          ),
      })
      console.log("- 격리된 DB 사본 migration과 진단을 통과했습니다.")
    },
  })
  await runCommand(["bun", "run", "doctor"])

  console.log("로컬 준비가 완료되었습니다. bun run dev를 실행하세요.")
  console.log(
    "관리자 로그인 값은 apps/api/.env의 ADMIN_SEED_EMAIL과 ADMIN_SEED_PASSWORD에서 확인하세요."
  )
}

function createCandidateDatabaseEnvironment(
  environment: Readonly<NodeJS.ProcessEnv>,
  candidatePath: string
): Readonly<NodeJS.ProcessEnv> {
  return Object.freeze({
    ...environment,
    DATABASE_URL: pathToFileURL(candidatePath).href,
  })
}

async function runCommand(
  command: readonly string[],
  environment: Readonly<NodeJS.ProcessEnv> = process.env
): Promise<void> {
  console.log(`\n> ${command.join(" ")}`)
  const child = Bun.spawn([...command], {
    cwd: repositoryRoot,
    env: environment,
    stderr: "inherit",
    stdin: "inherit",
    stdout: "inherit",
  })
  const exitCode = await child.exited

  if (exitCode !== 0) {
    throw new Error(`${command.join(" ")} 명령이 실패했습니다.`)
  }
}

if (import.meta.main) {
  try {
    await runSetup()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
