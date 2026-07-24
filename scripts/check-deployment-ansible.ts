import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

export function readDeploymentPlaybooks(
  ansibleRoot: string
): readonly string[] {
  return fs
    .readdirSync(path.join(ansibleRoot, "playbooks"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
    .map((entry) => path.join("playbooks", entry.name))
    .sort()
}

function runCommand(
  cwd: string,
  command: string,
  args: readonly string[]
): void {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: "inherit",
  })

  if (result.error !== undefined) {
    console.error(result.error.message)
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function runDeploymentAnsibleCheck(): void {
  if (process.platform === "win32") {
    console.error(
      "Ansible 배포 검증은 Linux 또는 WSL2 제어 노드에서 실행해야 합니다."
    )
    process.exit(1)
  }

  const ansibleRoot = path.resolve(import.meta.dir, "..", "infra", "ansible")
  const inventories = ["production", "staging"].map((environment) =>
    path.join("inventories", environment, "hosts.example.yaml")
  )

  runCommand(ansibleRoot, "ansible-lint", ["."])
  for (const inventory of inventories) {
    for (const playbook of readDeploymentPlaybooks(ansibleRoot)) {
      runCommand(ansibleRoot, "ansible-playbook", [
        "--syntax-check",
        "-i",
        inventory,
        playbook,
      ])
    }
  }

  console.log(
    "Ansible lint와 production/staging playbook syntax 검증을 통과했습니다."
  )
}

if (import.meta.main) runDeploymentAnsibleCheck()
