import fs from "node:fs"
import path from "node:path"
import { describe, expect, test } from "bun:test"

import {
  assertWorkflowMatchesReleaseInputContract,
  collectWorkflowInputReferences,
  findMissingReleaseInputs,
  readReleaseInputContract,
} from "#scripts/check-github-release-configuration"

const repositoryRoot = path.resolve(import.meta.dir, "..")

describe("GitHub release 입력 계약", () => {
  test("현재 workflow의 variable, secret과 environment를 모두 선언한다", () => {
    const contract = readReleaseInputContract()
    const workflow = fs.readFileSync(
      path.join(repositoryRoot, ...contract.workflow.split("/")),
      "utf8"
    )

    expect(() =>
      assertWorkflowMatchesReleaseInputContract(contract, workflow)
    ).not.toThrow()
  })

  test("workflow에 계약 밖의 secret이 생기면 실패한다", () => {
    const contract = readReleaseInputContract()
    const workflow = fs.readFileSync(
      path.join(repositoryRoot, ...contract.workflow.split("/")),
      "utf8"
    )

    expect(() =>
      assertWorkflowMatchesReleaseInputContract(
        contract,
        `${workflow}\n# \${{ secrets.UNDECLARED_SECRET }}\n`
      )
    ).toThrow("UNDECLARED_SECRET")
  })

  test("workflow environment 이름의 대소문자 불일치를 거부한다", () => {
    const contract = readReleaseInputContract()
    const workflow = fs
      .readFileSync(
        path.join(repositoryRoot, ...contract.workflow.split("/")),
        "utf8"
      )
      .replace("environment: Production", "environment: production")

    expect(() =>
      assertWorkflowMatchesReleaseInputContract(contract, workflow)
    ).toThrow("environment")
  })

  test("누락된 이름만 scope별로 보고한다", () => {
    const contract = readReleaseInputContract()
    const missing = findMissingReleaseInputs(contract, {
      environments: {
        Production: {
          secrets: new Set(contract.environments.Production?.secrets),
          variables: new Set(contract.environments.Production?.variables),
        },
        staging: {
          secrets: new Set(),
          variables: new Set(["STAGING_WEB_ORIGIN"]),
        },
      },
      repository: {
        secrets: new Set(),
        variables: new Set(contract.repository.variables),
      },
    })

    expect(missing).toEqual([
      {
        label: "staging environment variables",
        names: [
          "K6_CURRICULUM_VERSION_ID",
          "K6_LESSON_ID",
          "K6_STEP_ID",
          "K6_WRONG_OPTION_ID",
        ],
      },
      {
        label: "staging environment secrets",
        names: contract.environments.staging?.secrets,
      },
    ])
  })

  test("expression 참조에서 이름만 수집한다", () => {
    expect(
      collectWorkflowInputReferences(`
    environment: staging
    value: \${{ vars.PUBLIC_ORIGIN }}
    password: \${{ secrets.PRIVATE_PASSWORD }}
`)
    ).toEqual({
      environments: new Set(["staging"]),
      secrets: new Set(["PRIVATE_PASSWORD"]),
      variables: new Set(["PUBLIC_ORIGIN"]),
    })
  })
})
