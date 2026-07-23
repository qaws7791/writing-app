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
