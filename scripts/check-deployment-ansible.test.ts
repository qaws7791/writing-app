import { describe, expect, test } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { readDeploymentPlaybooks } from "./check-deployment-ansible"

describe("Ansible 배포 검증", () => {
  test("모든 yaml playbook을 결정적 순서로 선택한다", () => {
    using fixture = createFixture()

    expect(readDeploymentPlaybooks(fixture.path)).toEqual([
      path.join("playbooks", "deploy.yaml"),
      path.join("playbooks", "verify.yaml"),
    ])
  })

  test("role 식별자와 playbook 참조가 Ansible lint 이름 규칙을 따른다", () => {
    const repositoryRoot = path.resolve(import.meta.dir, "..")
    const rolesDirectory = path.join(
      repositoryRoot,
      "infra",
      "ansible",
      "roles"
    )
    const roleNames = fs
      .readdirSync(rolesDirectory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()

    expect(roleNames).toEqual([
      "docker_host",
      "writing_app_deploy",
      "writing_app_host",
    ])
    for (const roleName of roleNames) {
      expect(roleName).toMatch(/^[a-z][a-z0-9_]*$/u)
    }

    const bootstrapPlaybook = fs.readFileSync(
      path.join(
        repositoryRoot,
        "infra",
        "ansible",
        "playbooks",
        "bootstrap.yaml"
      ),
      "utf8"
    )
    const deployPlaybook = fs.readFileSync(
      path.join(repositoryRoot, "infra", "ansible", "playbooks", "deploy.yaml"),
      "utf8"
    )
    const dockerHostTasks = fs.readFileSync(
      path.join(rolesDirectory, "docker_host", "tasks", "main.yaml"),
      "utf8"
    )

    expect(bootstrapPlaybook).toContain("    - docker_host")
    expect(bootstrapPlaybook).toContain("    - writing_app_host")
    expect(deployPlaybook).toContain("name: writing_app_host")
    expect(deployPlaybook).toContain("name: writing_app_deploy")
    expect(dockerHostTasks).toContain("- name: APT keyring 디렉터리 생성")
  })
})

function createFixture(): Disposable & { readonly path: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "deployment-ansible-"))
  const playbooks = path.join(root, "playbooks")
  fs.mkdirSync(playbooks)
  fs.writeFileSync(path.join(playbooks, "verify.yaml"), "---\n")
  fs.writeFileSync(path.join(playbooks, "notes.md"), "# 제외\n")
  fs.writeFileSync(path.join(playbooks, "deploy.yaml"), "---\n")

  return {
    path: root,
    [Symbol.dispose]() {
      fs.rmSync(root, { force: true, recursive: true })
    },
  }
}
