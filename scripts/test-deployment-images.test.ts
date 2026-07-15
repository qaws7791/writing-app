import { describe, expect, test } from "bun:test"
import path from "node:path"

import {
  createContainerRunArguments,
  createImageBuildArguments,
  createRuntimeEnvironment,
  deploymentImageSpecs,
  isExpectedRuntimeUser,
} from "./test-deployment-images"

describe("production image smoke 계약", () => {
  test("네 앱의 linux/amd64 BuildKit build를 정의한다", () => {
    expect(deploymentImageSpecs.map((spec) => spec.name)).toEqual([
      "web",
      "api",
      "admin",
      "admin-api",
    ])

    for (const spec of deploymentImageSpecs) {
      const args = createImageBuildArguments(
        spec,
        `fixture/${spec.name}:test`,
        path.join("fixture", "repository")
      )
      expect(args.slice(0, 5)).toEqual([
        "buildx",
        "build",
        "--load",
        "--platform",
        "linux/amd64",
      ])
      expect(args).toContain(
        path.join("fixture", "repository", spec.dockerfile)
      )
    }
  })

  test("컨테이너는 host port 없이 격리하고 DB 앱만 volume을 연결한다", () => {
    for (const spec of deploymentImageSpecs) {
      const args = createContainerRunArguments(
        spec,
        `fixture/${spec.name}:test`,
        `fixture-${spec.name}`,
        "/fixture/data",
        [["NODE_ENV", "production"]]
      )

      expect(args).toContain("none")
      expect(args).not.toContain("--publish")
      expect(args).not.toContain("-p")
      expect(args.includes("--mount")).toBe(spec.usesDatabase)
    }
  })

  test("명시적인 비 root image user만 허용한다", () => {
    expect(isExpectedRuntimeUser("10001:10001\n")).toBe(true)
    expect(isExpectedRuntimeUser("")).toBe(false)
    expect(isExpectedRuntimeUser("root")).toBe(false)
    expect(isExpectedRuntimeUser("10001")).toBe(false)
  })

  test("인증 secret은 API 컨테이너에만 전달한다", () => {
    for (const spec of deploymentImageSpecs) {
      const names = createRuntimeEnvironment(
        spec,
        "learner-fixture",
        "admin-fixture"
      ).map(([name]) => name)

      expect(names.includes("BETTER_AUTH_SECRET")).toBe(spec.usesDatabase)
      expect(names.includes("ADMIN_BETTER_AUTH_SECRET")).toBe(spec.usesDatabase)
    }
  })
})
