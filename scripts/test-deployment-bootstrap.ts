import { spawn } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

export interface BootstrapEnvironment {
  readonly architecture: string
  readonly ci: string | undefined
  readonly disposableUbuntu: string | undefined
  readonly platform: NodeJS.Platform
  readonly release: Readonly<Record<string, string>>
}

interface BootstrapFixture extends Disposable {
  readonly cleanupPlaybookPath: string
  readonly extraVariables: string
  readonly inventoryPath: string
  readonly maintenancePlaybookPath: string
}

interface CommandResult {
  readonly exitCode: number
  readonly stderr: string
  readonly stdout: string
}

export function parseOsRelease(
  content: string
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    content
      .split(/\r?\n/u)
      .map((line) => /^([A-Z_]+)=(.*)$/u.exec(line))
      .filter((match): match is RegExpExecArray => match !== null)
      .map((match) => [match[1] ?? "", unquote(match[2] ?? "")])
  )
}

export function validateBootstrapEnvironment(
  environment: BootstrapEnvironment
): readonly string[] {
  const errors: string[] = []
  if (environment.platform !== "linux") {
    errors.push("bootstrap 멱등성 검증은 Linux에서만 실행할 수 있습니다.")
  }
  if (environment.architecture !== "x64") {
    errors.push("bootstrap 멱등성 검증은 linux/amd64가 필요합니다.")
  }
  if (
    environment.release["ID"] !== "ubuntu" ||
    environment.release["VERSION_ID"] !== "24.04"
  ) {
    errors.push("bootstrap 멱등성 검증은 Ubuntu 24.04가 필요합니다.")
  }
  if (environment.ci !== "true") {
    errors.push("CI=true인 일회성 runner에서만 실행할 수 있습니다.")
  }
  if (environment.disposableUbuntu !== "true") {
    errors.push(
      "WRITING_APP_DISPOSABLE_UBUNTU=true로 일회성 호스트를 명시해야 합니다."
    )
  }
  return errors
}

export function readChangedTaskCount(output: string): number | undefined {
  const match = /^integration\s+:\s+ok=\d+\s+changed=(\d+)/mu.exec(output)
  return match === null ? undefined : Number(match[1])
}

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

function createBootstrapFixture(): BootstrapFixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "writing-app-bootstrap-"))
  const runId = `${process.pid}-${Date.now()}`
  const targetRoot = `/var/tmp/writing-app-bootstrap-${runId}`
  const inventoryPath = path.join(root, "inventory.yaml")
  const cleanupPlaybookPath = path.join(root, "cleanup.yaml")
  const maintenancePlaybookPath = path.join(root, "maintenance.yaml")
  const maintenanceEvidenceDirectory = `${targetRoot}/evidence`
  const maintenanceEvidenceFile = `${maintenanceEvidenceDirectory}/log-retention.json`

  fs.writeFileSync(
    inventoryPath,
    [
      "all:",
      "  children:",
      "    writing_app:",
      "      hosts:",
      "        integration:",
      "          ansible_connection: local",
      "          ansible_python_interpreter: /usr/bin/python3",
      "",
    ].join("\n")
  )
  fs.writeFileSync(
    cleanupPlaybookPath,
    [
      "---",
      "- name: Writing App bootstrap fixture 정리",
      "  hosts: writing_app",
      "  become: true",
      "  gather_facts: false",
      "  tasks:",
      "    - name: Task 소유 디렉터리 삭제",
      "      ansible.builtin.file:",
      `        path: ${targetRoot}`,
      "        state: absent",
      "",
    ].join("\n")
  )
  fs.writeFileSync(
    maintenancePlaybookPath,
    [
      "---",
      "- name: Writing App maintenance role 멱등성 fixture",
      "  hosts: writing_app",
      "  become: true",
      "  gather_facts: false",
      "  pre_tasks:",
      "    - name: Maintenance fixture 증거 디렉터리 준비",
      "      ansible.builtin.file:",
      `        path: ${maintenanceEvidenceDirectory}`,
      "        state: directory",
      "        owner: root",
      "        group: root",
      '        mode: "0755"',
      "    - name: Maintenance fixture 외부 보존 증거 배치",
      "      ansible.builtin.copy:",
      `        dest: ${maintenanceEvidenceFile}`,
      "        owner: root",
      "        group: root",
      '        mode: "0600"',
      "        content: |",
      "          {",
      '            "applicationRequestRetentionDays": 30,',
      '            "evidenceId": "ansible-idempotency-fixture",',
      '            "securityRetentionDays": 90,',
      '            "sink": "fixture-only",',
      '            "validUntil": "2099-01-01T00:00:00.000Z",',
      '            "verifiedAt": "2026-07-24T00:00:00.000Z"',
      "          }",
      "  roles:",
      "    - role: writing_app_maintenance",
      "  post_tasks:",
      "    - name: Maintenance 전용 환경 결과 읽기",
      "      ansible.builtin.slurp:",
      `        src: ${targetRoot}/config/maintenance.env`,
      "      register: writing_app_maintenance_fixture_environment",
      "      changed_when: false",
      "    - name: Staging maintenance 대상 환경 검증",
      "      ansible.builtin.assert:",
      "        that:",
      "          - >-",
      "            'DAILY_MAINTENANCE_ENVIRONMENT=staging'",
      "            in (writing_app_maintenance_fixture_environment.content | b64decode)",
      "          - >-",
      "            'DAILY_MAINTENANCE_APPROVED=true'",
      "            in (writing_app_maintenance_fixture_environment.content | b64decode)",
      "",
    ].join("\n")
  )

  return {
    cleanupPlaybookPath,
    extraVariables: JSON.stringify({
      writing_app_api_image: `example.invalid/writing-app-api@sha256:${"a".repeat(64)}`,
      writing_app_backup_directory: `${targetRoot}/backups`,
      writing_app_compose_directory: `${targetRoot}/compose`,
      writing_app_config_directory: `${targetRoot}/config`,
      writing_app_data_directory: `${targetRoot}/data`,
      writing_app_deployment_directory: `${targetRoot}/deployments`,
      writing_app_environment: "staging",
      writing_app_libexec_directory: `${targetRoot}/libexec`,
      writing_app_maintenance_batch_size: 100,
      writing_app_maintenance_log_retention_evidence_file:
        maintenanceEvidenceFile,
      writing_app_maintenance_manage_timer: false,
      writing_app_maintenance_on_calendar: "*-*-* 02:15:00",
      writing_app_maintenance_randomized_delay_seconds: 0,
      writing_app_operation_lock_directory: `${targetRoot}/operation.lock`,
      writing_app_systemd_unit_directory: `${targetRoot}/systemd`,
    }),
    inventoryPath,
    maintenancePlaybookPath,
    [Symbol.dispose]() {
      fs.rmSync(root, { force: true, recursive: true })
    },
  }
}

async function runCommand(
  command: string,
  args: readonly string[],
  cwd: string
): Promise<CommandResult> {
  const child = spawn(command, args, {
    cwd,
    env: {
      ...process.env,
      ANSIBLE_FORCE_COLOR: "false",
      ANSIBLE_NOCOLOR: "true",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  })
  let stdout = ""
  let stderr = ""
  child.stdout.on("data", (chunk: Buffer) => {
    stdout += chunk.toString()
    process.stdout.write(chunk)
  })
  child.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString()
    process.stderr.write(chunk)
  })

  const exitCode = await new Promise<number>((resolve, reject) => {
    child.once("error", reject)
    child.once("close", (code) => resolve(code ?? 1))
  })
  return { exitCode, stderr, stdout }
}

function requireSuccess(label: string, result: CommandResult): void {
  if (result.exitCode === 0) return
  throw new Error(`${label}에 실패했습니다. exit code: ${result.exitCode}`)
}

function requireIdempotentSecondRun(
  label: string,
  result: CommandResult
): void {
  requireSuccess(`${label} 두 번째 실행`, result)
  const changedTaskCount = readChangedTaskCount(result.stdout)
  if (changedTaskCount === undefined) {
    throw new Error(
      `${label} 두 번째 Ansible recap에서 changed 값을 찾지 못했습니다.`
    )
  }
  if (changedTaskCount !== 0) {
    throw new Error(
      `${label} 두 번째 실행에 ${changedTaskCount}개의 변경이 발생했습니다.`
    )
  }
}

async function runBootstrapIdempotencyTest(): Promise<void> {
  const release =
    process.platform === "linux" && fs.existsSync("/etc/os-release")
      ? parseOsRelease(fs.readFileSync("/etc/os-release", "utf8"))
      : {}
  const errors = validateBootstrapEnvironment({
    architecture: process.arch,
    ci: process.env["CI"],
    disposableUbuntu: process.env["WRITING_APP_DISPOSABLE_UBUNTU"],
    platform: process.platform,
    release,
  })
  if (errors.length > 0) {
    throw new Error(errors.map((error) => `- ${error}`).join("\n"))
  }

  const repositoryRoot = path.resolve(import.meta.dir, "..")
  const ansibleRoot = path.join(repositoryRoot, "infra", "ansible")
  requireSuccess(
    "passwordless sudo 확인",
    await runCommand("sudo", ["-n", "true"], repositoryRoot)
  )

  using fixture = createBootstrapFixture()
  let taskError: unknown
  try {
    const args = [
      "-i",
      fixture.inventoryPath,
      "playbooks/bootstrap.yaml",
      "--extra-vars",
      fixture.extraVariables,
    ]
    console.log("Ubuntu bootstrap 첫 번째 실행을 시작합니다.")
    requireSuccess(
      "bootstrap 첫 번째 실행",
      await runCommand("ansible-playbook", args, ansibleRoot)
    )
    console.log("Ubuntu bootstrap 두 번째 실행을 시작합니다.")
    const secondRun = await runCommand("ansible-playbook", args, ansibleRoot)
    requireIdempotentSecondRun("bootstrap", secondRun)

    const maintenanceArgs = [
      "-i",
      fixture.inventoryPath,
      fixture.maintenancePlaybookPath,
      "--extra-vars",
      fixture.extraVariables,
    ]
    console.log("Daily maintenance role 첫 번째 실행을 시작합니다.")
    requireSuccess(
      "daily maintenance role 첫 번째 실행",
      await runCommand("ansible-playbook", maintenanceArgs, ansibleRoot)
    )
    console.log("Daily maintenance role 두 번째 실행을 시작합니다.")
    requireIdempotentSecondRun(
      "daily maintenance role",
      await runCommand("ansible-playbook", maintenanceArgs, ansibleRoot)
    )
  } catch (error) {
    taskError = error
  }

  const cleanup = await runCommand(
    "ansible-playbook",
    ["-i", fixture.inventoryPath, fixture.cleanupPlaybookPath],
    ansibleRoot
  )
  if (cleanup.exitCode !== 0 && taskError === undefined) {
    taskError = new Error("bootstrap fixture 정리에 실패했습니다.")
  }
  if (taskError !== undefined) throw taskError

  console.log(
    "Ubuntu 24.04 bootstrap과 daily maintenance role의 두 번째 실행 changed=0을 확인했습니다."
  )
}

if (import.meta.main) {
  try {
    await runBootstrapIdempotencyTest()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
