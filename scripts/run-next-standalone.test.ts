import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "bun:test"

import {
  repairWindowsStandaloneDirectoryLinks,
  resolveStandaloneApplication,
  stageStandaloneAssets,
} from "#scripts/run-next-standalone"

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true })
  }
})

describe("Next standalone launcher", () => {
  it("지원하는 앱과 기본 port를 명시적으로 결정한다", () => {
    const rootDirectory = createTemporaryDirectory()

    expect(resolveStandaloneApplication("web", rootDirectory).defaultPort).toBe(
      3000
    )
    expect(
      resolveStandaloneApplication("admin", rootDirectory).defaultPort
    ).toBe(3001)
    expect(() => resolveStandaloneApplication("api", rootDirectory)).toThrow(
      'expected "web" or "admin"'
    )
  })

  it("static과 public을 generated server 기준 위치에 교체한다", () => {
    const rootDirectory = createTemporaryDirectory()
    const application = resolveStandaloneApplication("web", rootDirectory)
    mkdirSync(application.runtimeDirectory, { recursive: true })
    mkdirSync(application.staticSourceDirectory, { recursive: true })
    mkdirSync(application.publicSourceDirectory, { recursive: true })
    mkdirSync(application.staticTargetDirectory, { recursive: true })
    mkdirSync(application.publicTargetDirectory, { recursive: true })
    writeFileSync(application.serverPath, "")
    writeFileSync(join(application.staticSourceDirectory, "current.js"), "")
    writeFileSync(join(application.publicSourceDirectory, "current.png"), "")
    writeFileSync(join(application.staticTargetDirectory, "stale.js"), "")
    writeFileSync(join(application.publicTargetDirectory, "stale.png"), "")

    stageStandaloneAssets(application)

    expect(
      existsSync(join(application.staticTargetDirectory, "current.js"))
    ).toBe(true)
    expect(
      existsSync(join(application.publicTargetDirectory, "current.png"))
    ).toBe(true)
    expect(
      existsSync(join(application.staticTargetDirectory, "stale.js"))
    ).toBe(false)
    expect(
      existsSync(join(application.publicTargetDirectory, "stale.png"))
    ).toBe(false)
  })

  it("build output이 불완전하면 기존 target을 변경하기 전에 실패한다", () => {
    const rootDirectory = createTemporaryDirectory()
    const application = resolveStandaloneApplication("admin", rootDirectory)
    mkdirSync(application.runtimeDirectory, { recursive: true })
    mkdirSync(application.staticSourceDirectory, { recursive: true })
    mkdirSync(application.staticTargetDirectory, { recursive: true })
    writeFileSync(application.serverPath, "")
    writeFileSync(join(application.staticTargetDirectory, "preserved.js"), "")

    expect(() => stageStandaloneAssets(application)).toThrow(
      "missing standalone build output for admin"
    )
    expect(
      existsSync(join(application.staticTargetDirectory, "preserved.js"))
    ).toBe(true)
  })

  it("Windows standalone의 directory link를 junction으로 정규화한다", () => {
    const rootDirectory = createTemporaryDirectory()
    const standaloneRootDirectory = join(rootDirectory, "standalone")
    const nodeModulesDirectory = join(standaloneRootDirectory, "node_modules")
    const targetDirectory = join(nodeModulesDirectory, "package")
    const dependencyDirectory = join(
      nodeModulesDirectory,
      "consumer",
      "node_modules"
    )
    const dependencyLink = join(dependencyDirectory, "package")
    mkdirSync(targetDirectory, { recursive: true })
    mkdirSync(dependencyDirectory, { recursive: true })
    writeFileSync(join(targetDirectory, "package.json"), "{}")
    symlinkSync(
      targetDirectory,
      dependencyLink,
      process.platform === "win32" ? "junction" : "dir"
    )

    expect(
      repairWindowsStandaloneDirectoryLinks(standaloneRootDirectory, "win32")
    ).toBe(1)
    expect(existsSync(join(dependencyLink, "package.json"))).toBe(true)
  })
})

function createTemporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "next-standalone-test-"))
  temporaryDirectories.push(directory)
  return directory
}
