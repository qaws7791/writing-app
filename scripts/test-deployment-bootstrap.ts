import fs from "node:fs"
import os from "node:os"
import path from "node:path"

interface Fixture {
  readonly cleanup: string
  readonly extraVariables: string
  readonly inventory: string
  readonly root: string
}

function requireDisposableUbuntu(): void {
  const release =
    process.platform === "linux" && fs.existsSync("/etc/os-release")
      ? Object.fromEntries(
          fs
            .readFileSync("/etc/os-release", "utf8")
            .split(/\r?\n/u)
            .flatMap((line) => {
              const match = /^([A-Z_]+)=(.*)$/u.exec(line)
              return match
                ? [[match[1], match[2]?.replace(/^(['"])(.*)\1$/u, "$2")]]
                : []
            })
        )
      : {}
  const failures = [
    process.platform === "linux" || "Linux",
    process.arch === "x64" || "linux/amd64",
    (release["ID"] === "ubuntu" && release["VERSION_ID"] === "24.04") ||
      "Ubuntu 24.04",
    process.env["CI"] === "true" || "CI=true",
    process.env["WRITING_APP_DISPOSABLE_UBUNTU"] === "true" ||
      "WRITING_APP_DISPOSABLE_UBUNTU=true",
  ].filter((value): value is string => typeof value === "string")
  if (failures.length > 0) {
    throw new Error(
      `일회성 bootstrap runner 조건이 필요합니다: ${failures.join(", ")}`
    )
  }
}

function createFixture(): Fixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "writing-app-bootstrap-"))
  const target = `/var/tmp/writing-app-bootstrap-${process.pid}-${Date.now()}`
  const inventory = path.join(root, "inventory.yaml")
  const cleanup = path.join(root, "cleanup.yaml")
  fs.writeFileSync(
    inventory,
    `all:
  children:
    writing_app:
      hosts:
        integration:
          ansible_connection: local
          ansible_python_interpreter: /usr/bin/python3
`
  )
  fs.writeFileSync(
    cleanup,
    `---
- name: Writing App bootstrap fixture 정리
  hosts: writing_app
  become: true
  gather_facts: false
  tasks:
    - ansible.builtin.file:
        path: ${target}
        state: absent
`
  )
  return {
    cleanup,
    extraVariables: JSON.stringify({
      writing_app_backup_directory: `${target}/backups`,
      writing_app_compose_directory: `${target}/compose`,
      writing_app_config_directory: `${target}/config`,
      writing_app_data_directory: `${target}/data`,
      writing_app_deployment_directory: `${target}/deployments`,
    }),
    inventory,
    root,
  }
}

async function ansible(
  cwd: string,
  fixture: Fixture,
  playbook: string
): Promise<string> {
  const process = Bun.spawn(
    [
      "ansible-playbook",
      "-i",
      fixture.inventory,
      playbook,
      "--extra-vars",
      fixture.extraVariables,
    ],
    {
      cwd,
      env: {
        ...globalThis.process.env,
        ANSIBLE_FORCE_COLOR: "false",
        ANSIBLE_NOCOLOR: "true",
      },
      stderr: "pipe",
      stdout: "pipe",
    }
  )
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ])
  globalThis.process.stdout.write(stdout)
  globalThis.process.stderr.write(stderr)
  if (exitCode !== 0) throw new Error(`${playbook} 실행에 실패했습니다.`)
  return stdout
}

async function requireIdempotent(
  cwd: string,
  fixture: Fixture,
  playbook: string
): Promise<void> {
  await ansible(cwd, fixture, playbook)
  const second = await ansible(cwd, fixture, playbook)
  const changed = /^integration\s+:\s+ok=\d+\s+changed=(\d+)/mu.exec(
    second
  )?.[1]
  if (changed === undefined || changed !== "0") {
    throw new Error(
      `${playbook} 두 번째 실행 changed=${changed ?? "unknown"}입니다.`
    )
  }
}

async function run(): Promise<void> {
  requireDisposableUbuntu()
  const repository = path.resolve(import.meta.dir, "..")
  const ansibleRoot = path.join(repository, "infra", "ansible")
  const sudo = Bun.spawnSync(["sudo", "-n", "true"], { cwd: repository })
  if (sudo.exitCode !== 0) throw new Error("passwordless sudo가 필요합니다.")
  const fixture = createFixture()
  let failure: unknown
  try {
    await requireIdempotent(ansibleRoot, fixture, "playbooks/bootstrap.yaml")
  } catch (error) {
    failure = error
  }
  try {
    await ansible(ansibleRoot, fixture, fixture.cleanup)
  } catch (error) {
    failure ??= error
  } finally {
    fs.rmSync(fixture.root, { force: true, recursive: true })
  }
  if (failure !== undefined) throw failure
  console.log("Ubuntu bootstrap의 두 번째 실행 changed=0을 확인했습니다.")
}

if (import.meta.main) {
  try {
    await run()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
