import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { describe, expect, test } from "bun:test"

import {
  createLocalEnvironmentFiles,
  createLocalSetupEnvironment,
  hasLocalOnboardingFailures,
  inspectLocalOnboarding,
  prepareLocalDatabaseDirectory,
  type LocalCredentials,
} from "#scripts/local-onboarding"

const credentials: LocalCredentials = {
  adminAuthSecret: "admin-auth-secret-abcdefghijklmnopqrstuvwxyz-123456",
  adminSeedPassword: "LocalAdminPassword123!",
  cursorSigningSecret: "cursor-signing-secret-abcdefghijklmnopqrstuvwxyz-12",
  learnerAuthSecret: "learner-auth-secret-abcdefghijklmnopqrstuvwxyz-1234",
}

describe("로컬 온보딩", () => {
  test("API database 작업은 저장소 루트의 env와 상대 경로를 사용한다", () => {
    const manifest = JSON.parse(
      fs.readFileSync(
        path.resolve(import.meta.dir, "../apps/api/package.json"),
        "utf8"
      )
    ) as { readonly scripts?: Readonly<Record<string, string>> }
    const databaseScripts = {
      "audit:admin-auth": "admin-auth-audit.ts",
      "db:backup": "backup-database.ts",
      "db:migrate": "migrate-database.ts",
      "db:reconcile": "reconcile-database.ts",
      "db:reset": "reset-database.ts",
      "db:seed": "seed-database.ts",
      "revoke:admin-sessions": "revoke-admin-sessions.ts",
      "seed:admin": "seed-admin.ts",
    } as const

    for (const [scriptName, entrypoint] of Object.entries(databaseScripts)) {
      expect(manifest.scripts?.[scriptName]).toBe(
        `cd ../.. && bun --env-file=apps/api/.env apps/api/src/scripts/${entrypoint}`
      )
    }
  })

  test("누락된 환경 파일을 credential을 치환해 생성한다", () => {
    using fixture = createFixture()

    expect(
      createLocalEnvironmentFiles({
        createCredentials: () => credentials,
        repositoryRoot: fixture.path,
      })
    ).toEqual([
      { kind: "created", path: "apps/api/.env" },
      { kind: "created", path: "apps/web/.env" },
      { kind: "created", path: "apps/admin/.env" },
    ])

    expect(
      readEnvironmentValue(fixture.path, "apps/api/.env", "LEARNER_AUTH_SECRET")
    ).toBe(credentials.learnerAuthSecret)
    expect(
      readEnvironmentValue(
        fixture.path,
        "apps/api/.env",
        "CURSOR_SIGNING_SECRET"
      )
    ).toBe(credentials.cursorSigningSecret)
    expect(
      readEnvironmentValue(fixture.path, "apps/api/.env", "ADMIN_AUTH_SECRET")
    ).toBe(credentials.adminAuthSecret)
    expect(
      readEnvironmentValue(fixture.path, "apps/api/.env", "ADMIN_SEED_PASSWORD")
    ).toBe(credentials.adminSeedPassword)
    expect(
      readEnvironmentValue(
        fixture.path,
        "apps/api/.env",
        "ADMIN_SEED_RESET_PASSWORD"
      )
    ).toBe("false")
  })

  test("기존 환경 파일을 변경하지 않고 두 번째 실행을 멱등적으로 보존한다", () => {
    using fixture = createFixture()
    createLocalEnvironmentFiles({
      createCredentials: () => credentials,
      repositoryRoot: fixture.path,
    })
    const before = readEnvironmentFiles(fixture.path)

    expect(
      createLocalEnvironmentFiles({
        createCredentials: () => {
          throw new Error("기존 파일에는 새 credential을 만들면 안 됩니다.")
        },
        repositoryRoot: fixture.path,
      })
    ).toEqual([
      { kind: "preserved", path: "apps/api/.env" },
      { kind: "preserved", path: "apps/web/.env" },
      { kind: "preserved", path: "apps/admin/.env" },
    ])
    expect(readEnvironmentFiles(fixture.path)).toEqual(before)
  })

  test("기존 값은 보존하면서 누락 키를 보충한다", () => {
    using fixture = createFixture()
    createLocalEnvironmentFiles({
      createCredentials: () => credentials,
      repositoryRoot: fixture.path,
    })
    const apiPath = path.join(fixture.path, "apps/api/.env")
    removeFileValue(apiPath, "ADMIN_SEED_NAME")

    expect(
      createLocalEnvironmentFiles({
        createCredentials: () => credentials,
        repositoryRoot: fixture.path,
      })
    ).toEqual([
      {
        addedKeys: ["ADMIN_SEED_NAME"],
        kind: "updated",
        path: "apps/api/.env",
      },
      { kind: "preserved", path: "apps/web/.env" },
      { kind: "preserved", path: "apps/admin/.env" },
    ])
    expect(
      readEnvironmentValue(fixture.path, "apps/api/.env", "ADMIN_ORIGIN")
    ).toBe("http://127.0.0.1:3001")
    expect(
      readEnvironmentValue(fixture.path, "apps/admin/.env", "API_BASE_URL")
    ).toBe("http://localhost:4000")
    expect(
      readEnvironmentValue(fixture.path, "apps/api/.env", "LEARNER_AUTH_SECRET")
    ).toBe(credentials.learnerAuthSecret)
  })

  test("database 부모 디렉터리를 준비하되 기존 파일은 보존한다", () => {
    using fixture = createFixture()
    createLocalEnvironmentFiles({
      createCredentials: () => credentials,
      repositoryRoot: fixture.path,
    })

    const setupEnvironment = createLocalSetupEnvironment(fixture.path, {})
    expect(setupEnvironment.databaseUrl).toBe("file:data/api.sqlite")
    expect(setupEnvironment.processEnvironment.DATABASE_URL).toBe(
      "file:data/api.sqlite"
    )
    expect(
      prepareLocalDatabaseDirectory(fixture.path, setupEnvironment.databaseUrl)
    ).toBe("data")

    const databasePath = path.join(fixture.path, "data/api.sqlite")
    fs.writeFileSync(databasePath, "existing-database")

    expect(
      prepareLocalDatabaseDirectory(fixture.path, setupEnvironment.databaseUrl)
    ).toBe("data")
    expect(fs.readFileSync(databasePath, "utf8")).toBe("existing-database")
  })

  test("API env와 상속 환경이 충돌하면 값 노출 없이 거부한다", () => {
    using fixture = createFixture()
    createLocalEnvironmentFiles({
      createCredentials: () => credentials,
      repositoryRoot: fixture.path,
    })

    let message = ""
    try {
      createLocalSetupEnvironment(fixture.path, {
        ADMIN_SEED_PASSWORD: "shell-admin-password",
        DATABASE_URL: "file:shell.sqlite",
      })
    } catch (error) {
      message = error instanceof Error ? error.message : String(error)
    }

    expect(message).toBe(
      "로컬 setup 환경과 shell 환경이 충돌합니다: ADMIN_SEED_PASSWORD, DATABASE_URL"
    )
    expect(message).not.toContain("shell-admin-password")
    expect(message).not.toContain("shell.sqlite")
  })

  test("공백 경로와 file URL은 같은 SQLite 파일 경계로 해석한다", () => {
    using fixture = createFixture()
    createLocalEnvironmentFiles({
      createCredentials: () => credentials,
      repositoryRoot: fixture.path,
    })
    const apiEnvironmentPath = path.join(fixture.path, "apps/api/.env")

    replaceFileValue(
      apiEnvironmentPath,
      "DATABASE_URL",
      '"file:data directory/api.sqlite"'
    )
    const spacedEnvironment = createLocalSetupEnvironment(fixture.path, {})
    expect(
      prepareLocalDatabaseDirectory(fixture.path, spacedEnvironment.databaseUrl)
    ).toBe("data directory")

    const fileUrlPath = path.join(fixture.path, "file-url/api.sqlite")
    replaceFileValue(
      apiEnvironmentPath,
      "DATABASE_URL",
      pathToFileURL(fileUrlPath).href
    )
    const fileUrlEnvironment = createLocalSetupEnvironment(fixture.path, {})
    expect(
      prepareLocalDatabaseDirectory(
        fixture.path,
        fileUrlEnvironment.databaseUrl
      )
    ).toBe("file-url")
  })

  test("보간 URL과 SQLite 파일이 아닌 경로는 fail-closed한다", () => {
    using fixture = createFixture()
    createLocalEnvironmentFiles({
      createCredentials: () => credentials,
      repositoryRoot: fixture.path,
    })
    const apiEnvironmentPath = path.join(fixture.path, "apps/api/.env")
    replaceFileValue(
      apiEnvironmentPath,
      "DATABASE_URL",
      "file:$DATABASE_DIRECTORY/api.sqlite"
    )
    expect(() => createLocalSetupEnvironment(fixture.path, {})).toThrow(
      "환경 변수 보간"
    )

    replaceFileValue(apiEnvironmentPath, "DATABASE_URL", "file:data/api.sqlite")
    fs.mkdirSync(path.join(fixture.path, "data/api.sqlite"), {
      recursive: true,
    })
    expect(() =>
      prepareLocalDatabaseDirectory(fixture.path, "file:data/api.sqlite")
    ).toThrow("SQLite 파일")
  })

  test("production 환경과 관리자 password reset은 로컬 setup에서 거부한다", () => {
    using fixture = createFixture()
    createLocalEnvironmentFiles({
      createCredentials: () => credentials,
      repositoryRoot: fixture.path,
    })
    const apiEnvironmentPath = path.join(fixture.path, "apps/api/.env")

    replaceFileValue(apiEnvironmentPath, "NODE_ENV", "production")
    expect(() => createLocalSetupEnvironment(fixture.path, {})).toThrow(
      "NODE_ENV=development"
    )

    replaceFileValue(apiEnvironmentPath, "NODE_ENV", "development")
    replaceFileValue(apiEnvironmentPath, "ADMIN_SEED_RESET_PASSWORD", "true")
    expect(() => createLocalSetupEnvironment(fixture.path, {})).toThrow(
      "ADMIN_SEED_RESET_PASSWORD=false"
    )
  })

  test("도구, 환경 파일, 비밀값 분리와 공유 DB를 진단한다", () => {
    using fixture = createFixture()
    createLocalEnvironmentFiles({
      createCredentials: () => credentials,
      repositoryRoot: fixture.path,
    })
    fs.mkdirSync(path.join(fixture.path, "node_modules"))
    fs.mkdirSync(path.join(fixture.path, "data"))
    fs.writeFileSync(path.join(fixture.path, "data/api.sqlite"), "fixture")

    const checks = inspectLocalOnboarding({
      bunVersion: "1.3.10",
      nodeVersion: "24.15.0",
      repositoryRoot: fixture.path,
    })

    expect(hasLocalOnboardingFailures(checks)).toBe(false)
    expect(checks).toContainEqual({
      detail: "학습자 인증과 cursor 서명 비밀값이 분리되어 있습니다.",
      kind: "pass",
      label: "cursor 비밀값 분리",
    })
    expect(checks).toContainEqual({
      detail: "관리자 인증과 cursor 서명 비밀값이 분리되어 있습니다.",
      kind: "pass",
      label: "관리자 cursor 비밀값 분리",
    })
    expect(checks).toContainEqual({
      detail: "학습자와 관리자 인증 비밀값이 분리되어 있습니다.",
      kind: "pass",
      label: "인증 비밀값 분리",
    })
    expect(checks).toContainEqual({
      detail: "data/api.sqlite 파일이 있습니다.",
      kind: "pass",
      label: "로컬 데이터베이스",
    })
  })

  test("일치하지 않는 테스트 인증과 누락된 DB를 실패로 보고한다", () => {
    using fixture = createFixture()
    createLocalEnvironmentFiles({
      createCredentials: () => credentials,
      repositoryRoot: fixture.path,
    })
    fs.mkdirSync(path.join(fixture.path, "node_modules"))
    replaceFileValue(
      path.join(fixture.path, "apps/web/.env"),
      "ENABLE_TEST_AUTH",
      "false"
    )

    const checks = inspectLocalOnboarding({
      bunVersion: "1.3.10",
      nodeVersion: "24.15.0",
      repositoryRoot: fixture.path,
    })

    expect(hasLocalOnboardingFailures(checks)).toBe(true)
    expect(checks).toContainEqual({
      detail: "apps/api와 apps/web의 ENABLE_TEST_AUTH 값을 일치시키세요.",
      kind: "failure",
      label: "테스트 인증",
    })
    expect(checks).toContainEqual({
      detail: "bun run dev:admin:setup을 실행하세요.",
      kind: "failure",
      label: "로컬 데이터베이스",
    })
  })

  test("환경 파일이 있어도 필수 키가 누락되면 실패로 보고한다", () => {
    using fixture = createFixture()
    createLocalEnvironmentFiles({
      createCredentials: () => credentials,
      repositoryRoot: fixture.path,
    })
    fs.mkdirSync(path.join(fixture.path, "node_modules"))
    removeFileValue(path.join(fixture.path, "apps/api/.env"), "API_PORT")

    const checks = inspectLocalOnboarding({
      bunVersion: "1.3.10",
      nodeVersion: "24.15.0",
      repositoryRoot: fixture.path,
      requireDatabase: false,
    })

    expect(hasLocalOnboardingFailures(checks)).toBe(true)
    expect(checks).toContainEqual({
      detail: "필수 환경 변수가 없거나 비어 있습니다: API_PORT",
      kind: "failure",
      label: "apps/api/.env 필수 환경 변수",
    })
  })

  test("비어 있는 필수 키도 중복 선언 없이 보충한다", () => {
    using fixture = createFixture()
    createLocalEnvironmentFiles({
      createCredentials: () => credentials,
      repositoryRoot: fixture.path,
    })
    const apiPath = path.join(fixture.path, "apps/api/.env")
    replaceFileValue(apiPath, "ADMIN_AUTH_SECRET", "")

    const results = createLocalEnvironmentFiles({
      createCredentials: () => credentials,
      repositoryRoot: fixture.path,
    })

    expect(results[0]).toEqual({
      addedKeys: ["ADMIN_AUTH_SECRET"],
      kind: "updated",
      path: "apps/api/.env",
    })
    expect(
      readEnvironmentValue(fixture.path, "apps/api/.env", "ADMIN_AUTH_SECRET")
    ).toBe(credentials.adminAuthSecret)
    expect(
      fs.readFileSync(apiPath, "utf8").match(/^ADMIN_AUTH_SECRET=/gmu)?.length
    ).toBe(1)
  })
})

function createFixture(): Disposable & { readonly path: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "local-onboarding-"))
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({
      engines: { node: "24.x" },
      packageManager: "bun@1.3.10",
    })
  )

  writeExample(
    root,
    "apps/api/.env.example",
    [
      "LEARNER_AUTH_SECRET=replace-with-32-byte-local-api-secret",
      "CURSOR_SIGNING_SECRET=replace-with-distinct-32-byte-cursor-secret",
      "API_ORIGIN=http://localhost:4000",
      "API_ALLOWED_HOSTS=localhost:4000,127.0.0.1:4000,api:4000",
      "ADMIN_AUTH_SECRET=replace-with-32-byte-local-admin-secret",
      "ADMIN_ORIGIN=http://127.0.0.1:3001",
      "DATABASE_URL=file:data/api.sqlite",
      "NODE_ENV=development",
      "DEPLOYMENT_VERSION=local",
      "API_PORT=4000",
      "WEB_ORIGIN=http://localhost:3000",
      "ENABLE_TEST_AUTH=true",
      "ADMIN_SEED_EMAIL=owner@example.com",
      "ADMIN_SEED_NAME=관리자",
      "ADMIN_SEED_PASSWORD=replace-with-strong-local-admin-password",
      "ADMIN_SEED_RESET_PASSWORD=true",
      "OPENAI_MODEL=gpt-5.2",
    ].join("\n")
  )
  writeExample(
    root,
    "apps/web/.env.example",
    [
      "NEXT_PUBLIC_API_BASE_URL=http://localhost:4000",
      "API_BASE_URL=http://localhost:4000",
      "WEB_ORIGIN=http://localhost:3000",
      "ENABLE_TEST_AUTH=true",
      "CSP_REPORT_ONLY=false",
    ].join("\n")
  )
  writeExample(
    root,
    "apps/admin/.env.example",
    [
      "NEXT_PUBLIC_API_BASE_URL=http://localhost:4000",
      "NEXT_PUBLIC_LEARNER_WEB_ORIGIN=http://localhost:3000",
      "API_BASE_URL=http://localhost:4000",
      "ADMIN_ORIGIN=http://127.0.0.1:3001",
      "CSP_REPORT_ONLY=false",
    ].join("\n")
  )

  return {
    path: root,
    [Symbol.dispose]() {
      fs.rmSync(root, { force: true, recursive: true })
    },
  }
}

function writeExample(
  root: string,
  relativePath: string,
  content: string
): void {
  const filePath = path.join(root, relativePath)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
}

function readEnvironmentFiles(root: string): readonly string[] {
  return ["apps/api/.env", "apps/web/.env", "apps/admin/.env"].map((filePath) =>
    fs.readFileSync(path.join(root, filePath), "utf8")
  )
}

function readEnvironmentValue(
  root: string,
  relativePath: string,
  key: string
): string | undefined {
  const content = fs.readFileSync(path.join(root, relativePath), "utf8")
  return new RegExp(`^${key}=(.*)$`, "mu").exec(content)?.[1]
}

function replaceFileValue(filePath: string, key: string, value: string): void {
  const content = fs.readFileSync(filePath, "utf8")
  fs.writeFileSync(
    filePath,
    content.replace(new RegExp(`^${key}=.*$`, "mu"), `${key}=${value}`)
  )
}

function removeFileValue(filePath: string, key: string): void {
  const content = fs.readFileSync(filePath, "utf8")
  fs.writeFileSync(
    filePath,
    content.replace(new RegExp(`^${key}=.*(?:\\r?\\n|$)`, "mu"), "")
  )
}
