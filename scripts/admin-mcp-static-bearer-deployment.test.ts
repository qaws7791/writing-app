import { describe, expect, test } from "bun:test"
import fs from "node:fs"
import path from "node:path"

const repositoryRoot = path.resolve(import.meta.dir, "..")

function readRepositoryFile(relativePath: string): string {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8")
}

const defaults = readRepositoryFile("infra/ansible/vars/defaults.yaml")
const deployRole = readRepositoryFile(
  "infra/ansible/roles/writing_app_deploy/tasks/main.yaml"
)
const verifyPlaybook = readRepositoryFile("infra/ansible/playbooks/verify.yaml")
const rollbackPlaybook = readRepositoryFile(
  "infra/ansible/playbooks/rollback.yaml"
)

const issueBinary = "/workspace/bin/admin-mcp-token-issue"
const revokeBinary = "/workspace/bin/admin-mcp-token-revoke"

describe("관리자 MCP Static Bearer rollback 배포 계약", () => {
  test("rebaseline은 기본 비승인이고 exact image 입력이 비어 있다", () => {
    expect(defaults).toContain(
      "writing_app_admin_mcp_static_bearer_rebaseline_approved: false"
    )
    expect(defaults).toContain(
      'writing_app_admin_mcp_static_bearer_rebaseline_image: ""'
    )
  })

  test("rebaseline은 MCP 비활성 staging의 현재 검증 API digest만 허용한다", () => {
    expect(deployRole).toContain(
      "(writing_app_admin_mcp_static_bearer_rebaseline_approved | bool)"
    )
    expect(deployRole).toContain(
      "or not (writing_app_admin_mcp_enabled | bool)"
    )
    expect(deployRole).toContain("or writing_app_environment == 'staging'")
    expect(deployRole).toContain(
      "== writing_app_admin_mcp_static_bearer_rebaseline_image"
    )
    expect(deployRole).toContain(
      "writing_app_deploy_admin_mcp_compose_environments.results[0].stat.checksum"
    )
    expect(deployRole).toContain(
      "writing_app_deploy_admin_mcp_compose_environments.results[1].stat.checksum"
    )
  })

  test("검증 성공 rebaseline은 verified snapshot을 previous에 고정한다", () => {
    const task = verifyPlaybook.indexOf(
      "- name: Static Bearer 호환 Compose rollback baseline 재설정"
    )
    const nextTask = verifyPlaybook.indexOf("\n        - name:", task + 1)
    const contract = verifyPlaybook.slice(task, nextTask)

    expect(task).toBeGreaterThan(-1)
    expect(contract).toContain(
      'src: "{{ writing_app_compose_directory }}/.env.verified"'
    )
    expect(contract).toContain(
      'dest: "{{ writing_app_compose_directory }}/.env.previous"'
    )
    expect(contract).toContain(
      "writing_app_admin_mcp_static_bearer_rebaseline_approved | bool"
    )
  })

  test("활성 배포와 rollback은 선택된 target image의 token binary를 검사한다", () => {
    expect(deployRole).toContain("| ternary('.env.previous', '.env.verified')")
    expect(rollbackPlaybook).toContain(
      "| ternary('.env.previous', '.env.verified')"
    )
    expect(deployRole.match(new RegExp(issueBinary, "g"))?.length).toBe(2)
    expect(deployRole.match(new RegExp(revokeBinary, "g"))?.length).toBe(2)
    expect(rollbackPlaybook).toContain(issueBinary)
    expect(rollbackPlaybook).toContain(revokeBinary)
    expect(deployRole).toContain("accessSync(p,constants.X_OK)")
    expect(rollbackPlaybook).toContain("accessSync(p,constants.X_OK)")
    expect(rollbackPlaybook.indexOf("Static Bearer binary 검증")).toBeLessThan(
      rollbackPlaybook.indexOf("코드 롤백 mutation 전 operation lock 보존 설정")
    )
  })
})
