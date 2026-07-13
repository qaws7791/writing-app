import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, test } from "bun:test"

import {
  readToolchainContract,
  validateQualityGatesToolchain,
  validateToolchainRuntime,
} from "#scripts/check-toolchain"

const repositoryRoot = path.resolve(import.meta.dir, "..")

describe("toolchain 계약", () => {
  test("manifest의 exact Bun과 Node major를 읽는다", () => {
    expect(
      readToolchainContract({
        engines: { node: "24.x" },
        packageManager: "bun@1.3.10",
      })
    ).toEqual({
      contract: {
        bunVersion: "1.3.10",
        nodeMajor: 24,
        nodeRange: "24.x",
      },
      kind: "valid",
    })
  })

  test("범위 Bun version과 exact Node patch를 거부한다", () => {
    const result = readToolchainContract({
      engines: { node: "24.15.0" },
      packageManager: "bun@^1.3.10",
    })

    expect(result.kind).toBe("invalid")
  })

  test("실행 중인 Bun exact version과 Node major 불일치를 거부한다", () => {
    const contract = {
      bunVersion: "1.3.10",
      nodeMajor: 24,
      nodeRange: "24.x",
    } as const

    expect(
      validateToolchainRuntime(contract, {
        bunVersion: "1.3.14",
        nodeVersion: "22.18.0",
      })
    ).toHaveLength(2)
  })

  test("모든 CI job이 setup 뒤 install 전에 preflight를 실행한다", () => {
    const manifest = JSON.parse(
      readFileSync(path.join(repositoryRoot, "package.json"), "utf8")
    ) as unknown
    const contractResult = readToolchainContract(manifest)
    if (contractResult.kind === "invalid") {
      throw new Error(contractResult.errors.join("\n"))
    }
    const workflow = readFileSync(
      path.join(repositoryRoot, ".github", "workflows", "quality-gates.yml"),
      "utf8"
    )

    expect(
      validateQualityGatesToolchain(contractResult.contract, workflow)
    ).toEqual([])
  })
})
