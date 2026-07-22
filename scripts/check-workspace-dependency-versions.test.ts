import { describe, expect, test } from "bun:test"

import { findWorkspaceDependencyVersionDrift } from "#scripts/check-workspace-dependency-versions"

describe("workspace dependency version", () => {
  test("두 workspace가 쓰는 dependency는 exact catalog와 catalog:를 요구한다", () => {
    expect(
      findWorkspaceDependencyVersionDrift({
        catalog: { react: "^19.2.4" },
        manifests: [
          {
            path: "apps/admin/package.json",
            value: { dependencies: { react: "catalog:" } },
          },
          {
            path: "apps/web/package.json",
            value: { dependencies: { react: "^19.2.4" } },
          },
        ],
      })
    ).toEqual([
      "apps/web/package.json dependencies.react는 catalog:를 사용해야 한다.",
      "catalog의 react는 exact version이어야 한다.",
    ])
  })

  test("단일 consumer dependency는 workspace manifest가 직접 소유한다", () => {
    expect(
      findWorkspaceDependencyVersionDrift({
        catalog: { zod: "4.4.3" },
        manifests: [
          {
            path: "packages/shared/contracts/package.json",
            value: { dependencies: { zod: "catalog:" } },
          },
        ],
      })
    ).toEqual([
      "catalog의 zod는 1개 workspace만 사용합니다. 단일 consumer manifest가 version을 소유해야 합니다.",
      "packages/shared/contracts/package.json dependencies.zod는 단일 consumer이므로 직접 version을 선언해야 한다.",
    ])
  })

  test("내부 dependency는 workspace:* 이외의 version을 거부한다", () => {
    expect(
      findWorkspaceDependencyVersionDrift({
        catalog: {},
        manifests: [
          {
            path: "apps/web/package.json",
            value: {
              dependencies: { "@workspace/contracts": "^1.0.0" },
            },
          },
        ],
      })
    ).toEqual([
      "apps/web/package.json dependencies.@workspace/contracts는 workspace:*를 사용해야 한다.",
    ])
  })
})
