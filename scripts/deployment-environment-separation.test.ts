import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"

const repositoryRoot = path.resolve(import.meta.dir, "..")

describe("production/staging 운영 대상 분리", () => {
  it.each(["production", "staging"] as const)(
    "%s API, maintenance와 restore argv가 같은 대상 환경을 사용한다",
    (environment) => {
      const apiEnvironment = renderEnvironmentTemplate(
        readRepositoryFile(
          "infra/ansible/roles/writing_app_deploy/templates/api.env.j2"
        ),
        environment
      )
      const maintenanceEnvironment = renderEnvironmentTemplate(
        readRepositoryFile(
          "infra/ansible/roles/writing_app_maintenance/templates/maintenance.env.j2"
        ),
        environment
      )
      const restorePlaybook = parseRestorePlaybook(
        renderEnvironmentTemplate(
          readRepositoryFile("infra/ansible/playbooks/restore.yaml"),
          environment
        )
      )

      expect(readEnvironmentValue(apiEnvironment, "NODE_ENV")).toBe(
        "production"
      )
      expect(
        readEnvironmentValue(apiEnvironment, "DEPLOYMENT_ENVIRONMENT")
      ).toBe(environment)
      expect(
        readEnvironmentValue(
          maintenanceEnvironment,
          "DAILY_MAINTENANCE_ENVIRONMENT"
        )
      ).toBe(environment)
      const restoreEnvironments = readRestoreEnvironmentValues(
        restorePlaybook,
        "DELETION_RESTORE_ENVIRONMENT"
      )
      expect(restoreEnvironments.length).toBeGreaterThan(0)
      expect(new Set(restoreEnvironments)).toEqual(new Set([environment]))
    }
  )

  it("marker 복구는 live DB mount 대신 격리된 backup candidate service만 사용한다", () => {
    const restorePlaybook = parseRestorePlaybook(
      readRepositoryFile("infra/ansible/playbooks/restore.yaml")
    )
    const compose = Bun.YAML.parse(
      readRepositoryFile("deploy/compose/compose.yaml")
    ) as ComposeConfiguration
    const markerService = compose.services?.["deletion-marker-restore"]
    if (markerService === undefined) {
      throw new Error("deletion-marker-restore service를 찾지 못했습니다.")
    }
    const markerCommands = readRestoreMarkerCommands(restorePlaybook)

    expect(markerCommands.length).toBeGreaterThan(0)
    for (const argv of markerCommands) {
      expect(readDockerEnvironment(argv, "DATABASE_URL")).toBe(
        "{{ writing_app_restore_marker_database_url }}"
      )
      expect(
        readDockerEnvironment(argv, "DELETION_RESTORE_EXPECTED_DATABASE_URL")
      ).toBe("{{ writing_app_restore_marker_database_url }}")
      expect(argv).toContain("deletion-marker-restore")
      expect(argv).toContain("/workspace/bin/deletion-marker-restore")
    }

    expect(markerService.volumes).toEqual(
      expect.arrayContaining([
        {
          source: "${BACKUP_DIRECTORY:?BACKUP_DIRECTORY가 필요합니다}",
          target: "/var/backups/writing-app",
          type: "bind",
        },
      ])
    )
    expect(
      markerService.volumes?.every(
        (volume) => !volume.source.startsWith("${DATA_DIRECTORY")
      )
    ).toBe(true)
  })

  it("동일 image digest가 staging과 production의 정확한 asset origin만 허용한다", () => {
    const production = readDeploymentInventory("production")
    const staging = readDeploymentInventory("staging")

    expect(production.writing_app_content_asset_image_allowed_origins).toEqual(
      staging.writing_app_content_asset_image_allowed_origins
    )
    expect(
      new Set(production.writing_app_content_asset_image_allowed_origins).size
    ).toBe(2)
    expect(
      production.writing_app_content_asset_image_allowed_origins
    ).toContain(production.writing_app_admin_asset_public_base_url)
    expect(staging.writing_app_content_asset_image_allowed_origins).toContain(
      staging.writing_app_admin_asset_public_base_url
    )

    for (const relativePath of [
      "infra/ansible/roles/writing_app_deploy/templates/web.env.j2",
      "infra/ansible/roles/writing_app_deploy/templates/admin.env.j2",
    ]) {
      expect(readRepositoryFile(relativePath)).toContain(
        "CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS={{ writing_app_content_asset_image_allowed_origins | join(',') | to_json }}"
      )
    }
  })
})

type AnsiblePlay = {
  readonly tasks?: readonly AnsibleTask[]
}

type AnsibleTask = {
  readonly "ansible.builtin.command"?: {
    readonly argv?: unknown
  }
  readonly always?: readonly AnsibleTask[]
  readonly block?: readonly AnsibleTask[]
  readonly rescue?: readonly AnsibleTask[]
}

type ComposeConfiguration = {
  readonly services?: Readonly<Record<string, ComposeService>>
}

type ComposeService = {
  readonly volumes?: readonly ComposeVolume[]
}

type ComposeVolume = {
  readonly source: string
  readonly target: string
  readonly type: string
}

type DeploymentInventory = {
  readonly writing_app_admin_asset_public_base_url: string
  readonly writing_app_content_asset_image_allowed_origins: readonly string[]
}

function parseRestorePlaybook(source: string): readonly AnsiblePlay[] {
  return Bun.YAML.parse(source) as readonly AnsiblePlay[]
}

function readAllTasks(
  playbook: readonly AnsiblePlay[]
): readonly AnsibleTask[] {
  const rootTasks = playbook[0]?.tasks ?? []
  return rootTasks.flatMap((task) => [
    task,
    ...readNestedTasks(task.block),
    ...readNestedTasks(task.rescue),
    ...readNestedTasks(task.always),
  ])
}

function readNestedTasks(
  tasks: readonly AnsibleTask[] | undefined
): readonly AnsibleTask[] {
  return (tasks ?? []).flatMap((task) => [
    task,
    ...readNestedTasks(task.block),
    ...readNestedTasks(task.rescue),
    ...readNestedTasks(task.always),
  ])
}

function readRestoreMarkerCommands(
  playbook: readonly AnsiblePlay[]
): readonly (readonly string[])[] {
  return readAllTasks(playbook).flatMap((task) => {
    const argv = task["ansible.builtin.command"]?.argv
    return isStringArray(argv) &&
      argv.includes("/workspace/bin/deletion-marker-restore")
      ? [argv]
      : []
  })
}

function readRestoreEnvironmentValues(
  playbook: readonly AnsiblePlay[],
  name: string
): readonly string[] {
  return readRestoreMarkerCommands(playbook).map((argv) => {
    const value = readDockerEnvironment(argv, name)
    if (value === null) {
      throw new Error(`${name} Docker environment를 찾지 못했습니다.`)
    }
    return value
  })
}

function readDockerEnvironment(
  argv: readonly string[],
  name: string
): string | null {
  for (let index = 0; index < argv.length - 1; index += 1) {
    if (argv[index] !== "--env") continue
    const assignment = argv[index + 1]
    if (assignment?.startsWith(`${name}=`) === true) {
      return assignment.slice(name.length + 1)
    }
  }
  return null
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function readRepositoryFile(relativePath: string): string {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8")
}

function readDeploymentInventory(
  environment: "production" | "staging"
): DeploymentInventory {
  return Bun.YAML.parse(
    readRepositoryFile(
      `infra/ansible/inventories/${environment}/group_vars/all.example.yaml`
    )
  ) as DeploymentInventory
}

function renderEnvironmentTemplate(
  source: string,
  environment: "production" | "staging"
): string {
  return source.replaceAll("{{ writing_app_environment }}", environment)
}

function readEnvironmentValue(source: string, name: string): string | null {
  const line = source
    .split(/\r?\n/u)
    .find((candidate) => candidate.startsWith(`${name}=`))
  return line?.slice(name.length + 1) ?? null
}
