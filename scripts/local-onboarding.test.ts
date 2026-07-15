import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { describe, expect, test } from "bun:test"

import {
  createLocalEnvironmentFiles,
  hasLocalOnboardingFailures,
  inspectLocalOnboarding,
  type LocalCredentials,
} from "#scripts/local-onboarding"

const credentials: LocalCredentials = {
  adminAuthSecret: "admin-auth-secret-abcdefghijklmnopqrstuvwxyz-123456",
  adminSeedPassword: "LocalAdminPassword123!",
  learnerAuthSecret: "learner-auth-secret-abcdefghijklmnopqrstuvwxyz-1234",
}

describe("로컬 온보딩", () => {
  test("누락된 환경 파일만 credential을 치환해 생성한다", () => {
    using fixture = createFixture()

    expect(
      createLocalEnvironmentFiles({
        createCredentials: () => credentials,
        repositoryRoot: fixture.path,
      })
    ).toEqual([
      { kind: "created", path: "apps/api/.env" },
      { kind: "created", path: "apps/web/.env" },
      { kind: "created", path: "apps/admin-api/.env" },
      { kind: "created", path: "apps/admin/.env" },
    ])

    expect(
      readEnvironmentValue(fixture.path, "apps/api/.env", "BETTER_AUTH_SECRET")
    ).toBe(credentials.learnerAuthSecret)
    expect(
      readEnvironmentValue(
        fixture.path,
        "apps/admin-api/.env",
        "ADMIN_BETTER_AUTH_SECRET"
      )
    ).toBe(credentials.adminAuthSecret)
    expect(
      readEnvironmentValue(
        fixture.path,
        "apps/admin-api/.env",
        "ADMIN_SEED_PASSWORD"
      )
    ).toBe(credentials.adminSeedPassword)
    expect(
      readEnvironmentValue(
        fixture.path,
        "apps/admin-api/.env",
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
      { kind: "preserved", path: "apps/admin-api/.env" },
      { kind: "preserved", path: "apps/admin/.env" },
    ])
    expect(readEnvironmentFiles(fixture.path)).toEqual(before)
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
      detail: "bun run dev:app:setup과 bun run dev:admin:setup을 실행하세요.",
      kind: "failure",
      label: "로컬 데이터베이스",
    })
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
      "BETTER_AUTH_SECRET=replace-with-32-byte-local-api-secret",
      "DATABASE_URL=file:data/api.sqlite",
      "ENABLE_TEST_AUTH=true",
    ].join("\n")
  )
  writeExample(root, "apps/web/.env.example", "ENABLE_TEST_AUTH=true\n")
  writeExample(
    root,
    "apps/admin-api/.env.example",
    [
      "ADMIN_BETTER_AUTH_SECRET=replace-with-32-byte-local-admin-secret",
      "DATABASE_URL=file:../../data/api.sqlite",
      "ADMIN_SEED_PASSWORD=replace-with-strong-local-admin-password",
      "ADMIN_SEED_RESET_PASSWORD=true",
    ].join("\n")
  )
  writeExample(
    root,
    "apps/admin/.env.example",
    "ADMIN_ORIGIN=http://localhost:3001\n"
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
  return [
    "apps/api/.env",
    "apps/web/.env",
    "apps/admin-api/.env",
    "apps/admin/.env",
  ].map((filePath) => fs.readFileSync(path.join(root, filePath), "utf8"))
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
