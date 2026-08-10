import { describe, expect, test } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import {
  assertWorkflowMatchesReleaseInputContract,
  findMissingReleaseInputs,
  readReleaseInputContract,
  type ReleaseInputContract,
} from "#scripts/check-github-release-configuration"

const contract = {
  automaticSecrets: ["GITHUB_TOKEN"],
  environments: {
    staging: {
      optionalSecrets: ["ADMIN_MCP_SYNTHETIC_BEARER_TOKEN"],
      secrets: ["REQUIRED_SECRET"],
      variables: [],
    },
  },
  repository: { secrets: [], variables: [] },
  schemaVersion: 2,
  workflow: ".github/workflows/image-release.yml",
} satisfies ReleaseInputContract

describe("release input optional secrets", () => {
  test("workflow 참조 정합성에는 optional secret을 포함한다", () => {
    expect(() =>
      assertWorkflowMatchesReleaseInputContract(
        contract,
        [
          "jobs:",
          "  deploy:",
          "    environment: staging",
          "    env:",
          "      TOKEN: ${{ secrets.GITHUB_TOKEN }}",
          "      REQUIRED: ${{ secrets.REQUIRED_SECRET }}",
          "      OPTIONAL: ${{ secrets.ADMIN_MCP_SYNTHETIC_BEARER_TOKEN }}",
        ].join("\n")
      )
    ).not.toThrow()
  })

  test("GitHub 존재 사전검사는 비활성 배포와 rollback을 위해 optional secret 누락을 허용한다", () => {
    expect(
      findMissingReleaseInputs(contract, {
        environments: {
          staging: {
            secrets: new Set(["REQUIRED_SECRET"]),
            variables: new Set(),
          },
        },
        repository: { secrets: new Set(), variables: new Set() },
      })
    ).toEqual([])
  })

  test("같은 secret을 필수와 선택 목록에 함께 둘 수 없다", () => {
    const directory = fs.mkdtempSync(
      path.join(os.tmpdir(), "writing-app-release-input-")
    )
    const file = path.join(directory, "contract.json")
    try {
      fs.writeFileSync(
        file,
        JSON.stringify({
          ...contract,
          environments: {
            staging: {
              optionalSecrets: ["REQUIRED_SECRET"],
              secrets: ["REQUIRED_SECRET"],
              variables: [],
            },
          },
        })
      )

      expect(() => readReleaseInputContract(file)).toThrow(
        "secrets와 optionalSecrets"
      )
    } finally {
      fs.rmSync(directory, { force: true, recursive: true })
    }
  })

  test("schemaVersion 1 계약을 새 shape로 해석하지 않는다", () => {
    const directory = fs.mkdtempSync(
      path.join(os.tmpdir(), "writing-app-release-input-")
    )
    const file = path.join(directory, "contract.json")
    try {
      fs.writeFileSync(file, JSON.stringify({ ...contract, schemaVersion: 1 }))

      expect(() => readReleaseInputContract(file)).toThrow()
    } finally {
      fs.rmSync(directory, { force: true, recursive: true })
    }
  })
})
