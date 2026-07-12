import { describe, expect, test } from "bun:test"

import { findWorkspaceDependencyVersionDrift } from "./check-workspace-dependency-versions"

const catalog = {
  "@tailwindcss/postcss": "4.1.18",
  react: "19.2.4",
  "react-dom": "19.2.4",
  recharts: "3.9.2",
  vitest: "4.1.10",
}

describe("workspace dependency version", () => {
  test("공통 dependency의 개별 version drift를 검출한다", () => {
    expect(
      findWorkspaceDependencyVersionDrift({
        catalog,
        manifests: [
          {
            path: "apps/example/package.json",
            value: { devDependencies: { vitest: "^4.1.0" } },
          },
        ],
      })
    ).toEqual([
      "apps/example/package.json devDependencies.vitest는 catalog:를 사용해야 한다.",
    ])
  })

  test("catalog version 자체가 범위이면 실패한다", () => {
    expect(
      findWorkspaceDependencyVersionDrift({
        catalog: { ...catalog, react: "^19.2.4" },
        manifests: [],
      })
    ).toContain("catalog의 react는 exact version이어야 한다.")
  })

  test("Vitest script의 transitive runtime 의존을 거부한다", () => {
    expect(
      findWorkspaceDependencyVersionDrift({
        catalog,
        manifests: [
          {
            path: "packages/ui/package.json",
            value: { scripts: { test: "vitest run" } },
          },
        ],
      })
    ).toContain(
      "packages/ui/package.json는 Vitest test script와 catalog: devDependency를 함께 선언해야 한다."
    )
  })
})
