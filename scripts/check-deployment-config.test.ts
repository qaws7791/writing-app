import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"

import {
  validateComposeContract,
  validateUnifiedApiCaddyContract,
} from "./check-deployment-config"

const healthcheck = { test: ["CMD", "true"] }
const sqliteVolume = [{ target: "/var/lib/writing-app", type: "bind" }]
const readOnlySqliteVolume = [
  { read_only: true, target: "/var/lib/writing-app", type: "bind" },
]

function createValidComposeConfig(): unknown {
  const digest = "a".repeat(64)
  const apiImage = `example.invalid/writing-app-api@sha256:${digest}`
  const litestreamImage = `example.invalid/litestream@sha256:${digest}`
  return {
    services: {
      admin: {
        environment: { API_BASE_URL: "http://api:4000" },
        healthcheck,
        image: `example.invalid/writing-app-admin@sha256:${digest}`,
        init: true,
        networks: { admin: null },
      },
      api: {
        environment: {
          API_ALLOWED_HOSTS: "api.example.test,api:4000",
          ADMIN_ASSET_PUBLIC_BASE_URL: "https://assets.example.test",
          ADMIN_ASSET_S3_ACCESS_KEY: "asset-access-key",
          ADMIN_ASSET_S3_BUCKET: "writing-app-assets",
          ADMIN_ASSET_S3_ENDPOINT: "https://r2.example.test",
          ADMIN_ASSET_S3_REGION: "auto",
          ADMIN_ASSET_S3_SECRET_KEY: "asset-secret-key",
          ADMIN_AUTH_SECRET: "admin-fixture",
          ADMIN_ORIGIN: "https://admin.example.test",
          API_ORIGIN: "https://api.example.test",
          CURSOR_SIGNING_SECRET: "cursor-fixture",
          LEARNER_AUTH_SECRET: "learner-fixture",
        },
        healthcheck: {
          test: [
            "CMD",
            "bun",
            "fetch(url,{headers:{Host:new URL(process.env.API_ORIGIN).host}})",
          ],
        },
        image: apiImage,
        init: true,
        networks: { admin: null, learner: null },
        volumes: sqliteVolume,
      },
      caddy: { networks: { admin: null, edge: null, learner: null } },
      cloudflared: { networks: { edge: null } },
      "database-backup": {
        entrypoint: ["bun", "/workspace/bin/database-backup"],
        image: apiImage,
        network_mode: "none",
        restart: "no",
        volumes: readOnlySqliteVolume,
      },
      "database-check": {
        command: ["bun", "/workspace/bin/database-check"],
        image: apiImage,
        network_mode: "none",
        restart: "no",
        volumes: readOnlySqliteVolume,
      },
      "database-migrate": {
        command: ["bun", "/workspace/bin/database-migrate"],
        image: apiImage,
        network_mode: "none",
        restart: "no",
        volumes: sqliteVolume,
      },
      "database-restore": {
        command: [
          "restore",
          "-config",
          "/etc/litestream.yaml",
          "-if-db-not-exists",
          "-if-replica-exists",
          "/var/lib/writing-app/api.sqlite",
        ],
        image: litestreamImage,
        networks: { backup: null },
        restart: "no",
        volumes: [
          ...sqliteVolume,
          { target: "/var/backups/writing-app", type: "bind" },
        ],
      },
      litestream: {
        image: litestreamImage,
        networks: { backup: null },
        volumes: sqliteVolume,
      },
      web: {
        healthcheck,
        image: `example.invalid/writing-app-web@sha256:${digest}`,
        init: true,
        networks: { learner: null },
      },
    },
  }
}

describe("배포 Compose 계약", () => {
  test("현재 서비스와 격리 경계가 충족되면 통과한다", () => {
    expect(validateComposeContract(createValidComposeConfig())).toEqual([])
  })

  test("필수 서비스 누락과 제거된 legacy service를 거부한다", () => {
    const config = createValidComposeConfig() as {
      services: { "admin-api"?: unknown; cloudflared?: unknown }
    }
    delete config.services.cloudflared
    config.services["admin-api"] = {}

    expect(validateComposeContract(config)).toEqual(
      expect.arrayContaining([
        "Compose service cloudflared이(가) 없습니다.",
        "Compose에 제거된 admin-api service가 있으면 안 됩니다.",
      ])
    )
  })

  test("host port 공개를 거부한다", () => {
    const config = createValidComposeConfig() as {
      services: { web: { ports?: readonly unknown[] } }
    }
    config.services.web.ports = [{ published: "3000", target: 3000 }]

    expect(validateComposeContract(config)).toContain(
      "web: host port를 공개하면 안 됩니다."
    )
  })

  test("중복 환경 변수의 마지막 가변 tag로 해석된 image를 거부한다", () => {
    const config = createValidComposeConfig() as {
      services: { web: { image: string } }
    }
    config.services.web.image = "example.invalid/writing-app-web:latest"

    expect(validateComposeContract(config)).toContain(
      "web: immutable image digest가 필요합니다."
    )
  })

  test("잘못된 network와 SQLite volume을 거부한다", () => {
    const config = createValidComposeConfig() as {
      services: { api: { networks: object; volumes: readonly unknown[] } }
    }
    config.services.api.networks = { edge: null, learner: null }
    config.services.api.volumes = []

    expect(validateComposeContract(config)).toEqual(
      expect.arrayContaining([
        "api: network는 admin, learner만 사용해야 합니다.",
        "api: 공유 SQLite volume이 필요합니다.",
      ])
    )
  })

  test("통합 API의 Host 설정과 health Host 누락을 거부한다", () => {
    const config = createValidComposeConfig() as {
      services: {
        api: { environment: Record<string, string>; healthcheck: unknown }
      }
    }
    config.services.api.environment.API_ALLOWED_HOSTS = "api.example.test"
    config.services.api.healthcheck = healthcheck

    expect(validateComposeContract(config)).toEqual(
      expect.arrayContaining([
        "api: 내부 authority api:4000이 필요합니다.",
        "api: healthcheck는 configured API Host를 명시해야 합니다.",
      ])
    )
  })

  test("관리자 SSR은 통합 API upstream만 사용한다", () => {
    const config = createValidComposeConfig() as {
      services: { admin: { environment: Record<string, string> } }
    }
    config.services.admin.environment.API_BASE_URL = "http://wrong-api:4000"

    expect(validateComposeContract(config)).toContain(
      "admin: 단일 API의 api:4000 upstream을 사용해야 합니다."
    )
  })

  test("migration·backup·integrity 작업은 통합 API image의 전용 entry를 격리 실행한다", () => {
    const config = createValidComposeConfig() as {
      services: {
        "database-backup": { entrypoint: readonly string[] }
        "database-check": {
          command: readonly string[]
          image: string
          volumes: readonly unknown[]
        }
        "database-migrate": { command: readonly string[]; image: string }
      }
    }
    config.services["database-migrate"].command = [
      "bun",
      "--filter",
      "@workspace/db",
      "db:migrate",
    ]
    config.services["database-migrate"].image = "legacy-api:latest"
    config.services["database-backup"].entrypoint = [
      "bun",
      "apps/api/src/scripts/backup-database.ts",
    ]
    config.services["database-check"].image = "legacy-api:latest"
    config.services["database-check"].command = ["bun", "-e", "PRAGMA"]
    config.services["database-check"].volumes = sqliteVolume

    expect(validateComposeContract(config)).toEqual(
      expect.arrayContaining([
        "database-migrate: 통합 API와 같은 image를 사용해야 합니다.",
        "database-migrate: API image의 /workspace/bin/database-migrate를 Bun으로 실행해야 합니다.",
        "database-backup: API image의 /workspace/bin/database-backup를 Bun으로 실행해야 합니다.",
        "database-check: 통합 API와 같은 image를 사용해야 합니다.",
        "database-check: API image의 /workspace/bin/database-check를 Bun으로 실행해야 합니다.",
        "database-check: application DB volume은 read-only여야 합니다.",
      ])
    )
  })

  test("restore는 Litestream image와 실제·격리 volume을 사용한다", () => {
    const config = createValidComposeConfig() as {
      services: {
        "database-restore": {
          command: readonly string[]
          image: string
          volumes: readonly unknown[]
        }
      }
    }
    config.services["database-restore"].image = "legacy-litestream:latest"
    config.services["database-restore"].command = ["restore", "unsafe.sqlite"]
    config.services["database-restore"].volumes = sqliteVolume

    expect(validateComposeContract(config)).toEqual(
      expect.arrayContaining([
        "database-restore: Litestream과 같은 image를 사용해야 합니다.",
        "database-restore: 격리 복구용 backup volume이 필요합니다.",
        "database-restore: Litestream의 조건부 기본 복구 command를 유지해야 합니다.",
      ])
    )
  })
})

describe("배포 Caddy 계약", () => {
  const validCaddyfile = [
    "{",
    "\tadmin 127.0.0.1:2019",
    "}",
    "handle @learner-web {",
    "\treverse_proxy web:3000",
    "\t}",
    "handle @api {",
    "\treverse_proxy api:4000",
    "\t}",
    "handle @admin-web {",
    "\treverse_proxy admin:3001",
    "\t}",
  ].join("\n")

  test("단일 public API Host를 api upstream에 전달한다", () => {
    expect(validateUnifiedApiCaddyContract(validCaddyfile)).toEqual([])
  })

  test("관리 endpoint와 각 upstream drift를 거부한다", () => {
    expect(
      validateUnifiedApiCaddyContract(
        validCaddyfile.replace("\tadmin 127.0.0.1:2019", "\tadmin off")
      )
    ).toContain("Caddy 관리 endpoint는 127.0.0.1:2019로 제한해야 합니다.")
    expect(
      validateUnifiedApiCaddyContract(
        validCaddyfile.replace(
          "handle @api {\n\treverse_proxy api:4000",
          "handle @api {\n\treverse_proxy wrong-api:4000"
        )
      )
    ).toContain("Caddy API upstream은 api:4000이어야 합니다.")
    expect(
      validateUnifiedApiCaddyContract(
        validCaddyfile.replace(
          "reverse_proxy api:4000",
          "reverse_proxy api:4001"
        )
      )
    ).toContain("Caddy API upstream은 api:4000이어야 합니다.")
  })

  test("upstream Host 덮어쓰기를 거부한다", () => {
    expect(
      validateUnifiedApiCaddyContract(
        validCaddyfile.replace(
          "\treverse_proxy api:4000",
          "\treverse_proxy api:4000 {\n\t\theader_up Host api:4000\n\t}"
        )
      )
    ).toContain(
      "Caddy API upstream은 public Host를 내부 Host로 덮어쓰면 안 됩니다."
    )
    expect(
      validateUnifiedApiCaddyContract(
        validCaddyfile.replace(
          "\treverse_proxy admin:3001",
          "\treverse_proxy admin:3001 {\n\t\theader_up Host admin:3001\n\t}"
        )
      )
    ).toContain(
      "Caddy web upstream은 public Host를 내부 Host로 덮어쓰면 안 됩니다."
    )
  })
})

describe("repository 배포 source", () => {
  const repositoryRoot = path.resolve(import.meta.dir, "..")

  test("Ansible 환경 template은 공개 통합 API topology를 유지한다", () => {
    const apiEnvironmentTemplate = readFileSync(
      path.join(
        repositoryRoot,
        "infra/ansible/roles/writing_app_deploy/templates/api.env.j2"
      ),
      "utf8"
    )
    const adminEnvironmentTemplate = readFileSync(
      path.join(
        repositoryRoot,
        "infra/ansible/roles/writing_app_deploy/templates/admin.env.j2"
      ),
      "utf8"
    )
    const caddyEnvironmentTemplate = readFileSync(
      path.join(
        repositoryRoot,
        "infra/ansible/roles/writing_app_deploy/templates/caddy.env.j2"
      ),
      "utf8"
    )
    expect(apiEnvironmentTemplate).toContain(
      "API_ALLOWED_HOSTS={{ ([writing_app_api_host, 'api:4000'] | join(',')) | to_json }}"
    )
    expect(adminEnvironmentTemplate).toContain("API_BASE_URL=http://api:4000")
    expect(caddyEnvironmentTemplate).toContain(
      "API_HOST={{ writing_app_api_host | to_json }}"
    )
  })

  test("production runtime 환경 변수와 secret 이름은 parser example·Ansible에 함께 존재한다", () => {
    const apiEnvironmentParsers = [
      "apps/api/src/config/env.ts",
      "packages/config/env/src/parse-env.ts",
    ]
      .map((relativePath) =>
        readFileSync(path.join(repositoryRoot, relativePath), "utf8")
      )
      .join("\n")
    const apiEnvironmentExample = readFileSync(
      path.join(repositoryRoot, "apps/api/.env.example"),
      "utf8"
    )
    const apiEnvironmentTemplate = readFileSync(
      path.join(
        repositoryRoot,
        "infra/ansible/roles/writing_app_deploy/templates/api.env.j2"
      ),
      "utf8"
    )
    const compose = readFileSync(
      path.join(repositoryRoot, "deploy/compose/compose.yaml"),
      "utf8"
    )

    for (const name of [
      "ADMIN_ASSET_PUBLIC_BASE_URL",
      "ADMIN_ASSET_S3_ACCESS_KEY",
      "ADMIN_ASSET_S3_BUCKET",
      "ADMIN_ASSET_S3_ENDPOINT",
      "ADMIN_ASSET_S3_REGION",
      "ADMIN_ASSET_S3_SECRET_KEY",
      "ADMIN_AUTH_SECRET",
      "ADMIN_ORIGIN",
      "API_ALLOWED_HOSTS",
      "API_ORIGIN",
      "CURSOR_SIGNING_SECRET",
      "DATABASE_URL",
      "ENABLE_TEST_AUTH",
      "LEARNER_AUTH_SECRET",
      "NODE_ENV",
      "WEB_ORIGIN",
    ]) {
      expect(apiEnvironmentExample).toContain(name)
      expect(apiEnvironmentTemplate).toContain(`${name}=`)
      expect(apiEnvironmentParsers).toContain(name)
    }
    expect(compose).toContain(
      "DEPLOYMENT_VERSION: ${API_IMAGE:?API_IMAGE가 필요합니다}"
    )
    expect(apiEnvironmentExample).toContain("DATABASE_SEED_PRODUCTION_APPROVED")
    expect(apiEnvironmentTemplate).not.toContain(
      "DATABASE_SEED_PRODUCTION_APPROVED"
    )
  })

  test("Ansible은 immutable image, DNS Host, 공유 operation lock을 유지한다", () => {
    const deploymentTasks = readFileSync(
      path.join(
        repositoryRoot,
        "infra/ansible/roles/writing_app_deploy/tasks/main.yaml"
      ),
      "utf8"
    )
    const deploymentDefaults = readFileSync(
      path.join(repositoryRoot, "infra/ansible/vars/defaults.yaml"),
      "utf8"
    )
    const playbooks = [
      "deploy.yaml",
      "rollback.yaml",
      "restore.yaml",
      "verify.yaml",
    ].map((name) =>
      readFileSync(
        path.join(repositoryRoot, "infra/ansible/playbooks", name),
        "utf8"
      )
    )
    const deployPlaybook = playbooks[0] ?? ""
    const rollbackPlaybook = playbooks[1] ?? ""
    const restorePlaybook = playbooks[2] ?? ""
    const verifyPlaybook = playbooks[3] ?? ""

    expect(deploymentTasks).toContain("recreate: always")
    expect(deploymentTasks).toContain("profiles:\n          - operations")
    const rehearsalSnapshot = deploymentTasks.indexOf(
      "DB 리허설용 live snapshot 생성"
    )
    const isolatedRestore = deploymentTasks.indexOf(
      "최초 기동 전 격리 경로로 R2 복구 시도"
    )
    const rehearsalMigration = deploymentTasks.indexOf(
      "Candidate image로 격리된 DB migration 리허설"
    )
    const rehearsalCheck = deploymentTasks.indexOf(
      "Candidate image로 격리된 DB 검증 리허설"
    )
    const retainLock = deploymentTasks.indexOf(
      "실제 DB 변경 전 operation lock 보존 설정"
    )
    const stopWriter = deploymentTasks.indexOf("SQLite writer 중지")
    const finalSnapshot = deploymentTasks.indexOf(
      "중지된 DB의 최종 pre-deploy snapshot 백업"
    )
    const firstDatabaseInstall = deploymentTasks.indexOf(
      "검증된 최초 DB를 실제 경로에 원자적으로 설치"
    )
    const productionMigration = deploymentTasks.indexOf("DB migration 실행")
    const productionCheck = deploymentTasks.indexOf("배포 DB 무결성 검증")

    expect(rehearsalSnapshot).toBeGreaterThan(-1)
    expect(isolatedRestore).toBeGreaterThan(-1)
    expect(isolatedRestore).toBeLessThan(rehearsalMigration)
    expect(rehearsalSnapshot).toBeLessThan(rehearsalMigration)
    expect(rehearsalMigration).toBeLessThan(rehearsalCheck)
    expect(rehearsalCheck).toBeLessThan(retainLock)
    expect(retainLock).toBeLessThan(stopWriter)
    expect(stopWriter).toBeLessThan(firstDatabaseInstall)
    expect(firstDatabaseInstall).toBeLessThan(productionMigration)
    expect(stopWriter).toBeLessThan(finalSnapshot)
    expect(finalSnapshot).toBeLessThan(productionMigration)
    expect(productionMigration).toBeLessThan(productionCheck)
    expect(deploymentTasks).toContain("target=/var/lib/writing-app,readonly")
    expect(deploymentTasks).toContain("/workspace/bin/database-check")
    expect(deploymentTasks).toContain(
      "/var/backups/writing-app/deploy-{{ writing_app_deploy_deployment_id }}/rehearsal/api.sqlite"
    )
    expect(deploymentTasks).toContain("- -o")
    expect(deploymentTasks).toContain(
      '"--output=/var/backups/writing-app/deploy-{{ writing_app_deploy_deployment_id }}/pre-rehearsal.sqlite"'
    )
    expect(deploymentTasks).toContain(
      '"--output=/var/backups/writing-app/deploy-{{ writing_app_deploy_deployment_id }}/pre-deploy.sqlite"'
    )
    expect(restorePlaybook).toContain(
      '"--output=/var/backups/writing-app/pre-{{ writing_app_restore_id }}.sqlite"'
    )
    expect(restorePlaybook).toContain(
      '"{{ writing_app_backup_directory }}/{{ writing_app_restore_id }}/{{ item.item }}"'
    )
    expect(deploymentTasks).toContain(
      'dest: "{{ writing_app_deployment_directory }}/{{ writing_app_deploy_deployment_id }}.txt"'
    )
    expect(deployPlaybook).toContain(
      "writing_app_deploy_database_mutation_started: false"
    )
    expect(deploymentTasks).toContain(
      "writing_app_deploy_release_operation_lock: false"
    )
    expect(deployPlaybook).toContain("operation_lock_retained=")
    expect(deployPlaybook).toContain("recovery.txt")
    expect(deployPlaybook).toContain(
      "writing_app_deploy_release_operation_lock | default(true) | bool"
    )
    for (const imageVariable of [
      "writing_app_web_image",
      "writing_app_api_image",
      "writing_app_admin_image",
      "writing_app_caddy_image",
      "writing_app_cloudflared_image",
      "writing_app_litestream_image",
    ]) {
      expect(deploymentTasks).toContain(
        `${imageVariable} is match('^.+@sha256:[0-9a-f]{64}\\Z')`
      )
      expect(deploymentTasks).toContain(
        `${imageVariable} is match('^[^\\x00-\\x1F\\x7F]+\\Z')`
      )
    }
    expect(deploymentDefaults).toContain(
      "writing_app_operation_lock_directory: /var/lock/writing-app-operation.lock"
    )
    for (const playbook of playbooks) {
      expect(playbook).toContain("writing_app_operation_lock_directory")
      expect(playbook).toContain("- mkdir")
      expect(playbook).toContain("failed_when: false")
      expect(playbook).toMatch(/operation_lock\.rc == 0/u)
      expect(playbook).toContain("stale lock")
      expect(playbook).toContain("state: absent")
    }
    expect(deployPlaybook).toContain("writing_app_allow_production_deploy")
    expect(rollbackPlaybook).toContain("writing_app_allow_code_rollback")
    expect(rollbackPlaybook).toContain(
      "writing_app_code_rollback_database_compatible"
    )
    expect(rollbackPlaybook).toContain("직전 Compose 설정 해석")
    expect(rollbackPlaybook).toContain("- --format\n              - json")
    expect(rollbackPlaybook).toContain(
      "writing_app_previous_compose_configuration.stdout | from_json"
    )
    for (const serviceName of ["web", "api", "admin"]) {
      expect(rollbackPlaybook).toContain(
        `writing_app_previous_compose_services.${serviceName}.image`
      )
    }
    expect(rollbackPlaybook).not.toContain("regex_findall")
    expect(rollbackPlaybook).not.toContain("service: database-migrate")
    expect(rollbackPlaybook).not.toContain("service: database-restore")
    expect(restorePlaybook).toContain("writing_app_allow_database_restore")
    expect(verifyPlaybook.match(/checks:\n\s+database: ready/gu)).toHaveLength(
      4
    )
    expect(verifyPlaybook.match(/impact: none/gu)).toHaveLength(4)
  })

  test("실패로 staged 설정만 남아도 검증 성공 marker 없이는 전체 배포를 다시 실행한다", () => {
    const deploymentTasks = readFileSync(
      path.join(
        repositoryRoot,
        "infra/ansible/roles/writing_app_deploy/tasks/main.yaml"
      ),
      "utf8"
    )
    const fingerprintCalculation = deploymentTasks.indexOf(
      "현재 배포 입력 fingerprint 계산"
    )
    const markerRead = deploymentTasks.indexOf(
      "직전 검증 성공 fingerprint 읽기"
    )
    const deploymentChangeCalculation = deploymentTasks.indexOf(
      "배포 변경 여부 계산"
    )
    const safeDeployment = deploymentTasks.indexOf("변경된 배포 적용")
    const serviceHealth = deploymentTasks.indexOf(
      "Compose 서비스 기동 및 health 대기"
    )
    const markerWrite = deploymentTasks.indexOf(
      "검증 성공 배포 fingerprint 기록"
    )
    const releaseOperationLock = deploymentTasks.indexOf(
      "검증된 배포 후 operation lock 해제 허용"
    )
    const unchangedCompose = deploymentTasks.indexOf(
      "변경 없는 Compose 서비스 상태 확인"
    )

    expect(fingerprintCalculation).toBeGreaterThan(-1)
    expect(fingerprintCalculation).toBeLessThan(markerRead)
    expect(markerRead).toBeLessThan(deploymentChangeCalculation)
    expect(deploymentChangeCalculation).toBeLessThan(safeDeployment)
    expect(deploymentTasks).toContain(
      "or not (writing_app_deploy_verified_state_matches | bool)"
    )
    expect(serviceHealth).toBeLessThan(markerWrite)
    expect(markerWrite).toBeLessThan(releaseOperationLock)
    expect(releaseOperationLock).toBeLessThan(unchangedCompose)
    expect(deploymentTasks).toContain(
      "{{ writing_app_deployment_directory }}/verified-state.sha256"
    )
    expect(deploymentTasks).toContain(
      'content: "{{ writing_app_deploy_desired_state_fingerprint }}\\n"'
    )
    expect(deploymentTasks.indexOf("recreate: always")).toBeLessThan(
      markerWrite
    )
  })
})
