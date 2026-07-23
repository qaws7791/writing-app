import { describe, expect, it } from "bun:test"

import {
  findAdminApiRuntimeResiduals,
  isCurrentArchitectureFile,
} from "#scripts/check-admin-api-runtime-removal"

describe("legacy admin-api runtime 제거 검사", () => {
  it.each([
    ["workspace", "apps/admin-api/src/main.ts"],
    ["package", "@workspace/admin-api"],
    ["image", "ADMIN_API_IMAGE=example.invalid/admin-api@sha256:fixture"],
    ["port", "ADMIN_API_PORT=4101"],
    ["upstream", "reverse_proxy admin-api:4101"],
    ["hostname", "https://admin-api.example.test"],
    ["dockerfile", "deploy/docker/admin-api.dockerfile"],
    ["environment", "admin-api.env"],
    ["rollback", "admin-traffic-rollback.yaml"],
    ["Ansible variable", "writing_app_admin_api_image"],
  ])("%s legacy 식별자를 거절한다", (_label, content) => {
    expect(
      findAdminApiRuntimeResiduals([{ content, path: "fixture.txt" }])
    ).not.toEqual([])
  })

  it("제거된 public admin API 환경 변수와 alias를 거절한다", () => {
    expect(
      findAdminApiRuntimeResiduals([
        {
          content: [
            "ADMIN_API_HOST=admin-api.example.test",
            "ADMIN_API_ALLOWED_HOSTS=admin-api.example.test",
            "ADMIN_API_BASE_URL=http://admin-api-unified:4000",
            'service: "admin-api"',
          ].join("\n"),
          path: "fixture.txt",
        },
      ])
    ).not.toEqual([])
  })

  it("historical ADR·MTA와 검사 자체는 current source scan에서 제외한다", () => {
    expect(
      isCurrentArchitectureFile(
        "docs/work/2026-07-20-api-traffic-switch/plan.md"
      )
    ).toBe(false)
    expect(
      isCurrentArchitectureFile(
        "docs/engineering/adr/ADR-0012-single-api-runtime.md"
      )
    ).toBe(false)
    expect(
      isCurrentArchitectureFile(
        "docs\\engineering\\adr\\ADR-0012-single-api-runtime.md"
      )
    ).toBe(false)
    expect(
      isCurrentArchitectureFile(
        "docs\\archive\\2026-07-20-api-traffic-switch\\plan.md"
      )
    ).toBe(false)
    expect(
      isCurrentArchitectureFile("scripts/check-admin-api-runtime-removal.ts")
    ).toBe(false)
    expect(isCurrentArchitectureFile("README.md")).toBe(true)
  })
})
