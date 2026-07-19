import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"

import {
  validateComposeContract,
  validateUnifiedApiCaddyContract,
} from "./check-deployment-config"

const healthcheck = { test: ["CMD", "true"] }
const sqliteVolume = [{ target: "/var/lib/writing-app", type: "bind" }]

function createValidComposeConfig(): unknown {
  return {
    services: {
      admin: {
        environment: { API_BASE_URL: "http://api:4000" },
        healthcheck,
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
        init: true,
        networks: { admin: null, learner: null },
        volumes: sqliteVolume,
      },
      caddy: { networks: { admin: null, edge: null, learner: null } },
      cloudflared: { networks: { edge: null } },
      "database-backup": {},
      "database-check": {},
      "database-migrate": {},
      "database-restore": {},
      litestream: { networks: { backup: null }, volumes: sqliteVolume },
      web: { healthcheck, init: true, networks: { learner: null } },
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

  test("legacy admin-api 배포 source를 제거하고 공개 통합 API 계약을 유지한다", () => {
    const compose = readFileSync(
      path.join(repositoryRoot, "deploy/compose/compose.yaml"),
      "utf8"
    )
    const caddyfile = readFileSync(
      path.join(repositoryRoot, "deploy/caddy/caddyfile"),
      "utf8"
    )
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

    expect(compose).toContain("API_ORIGIN")
    expect(compose).not.toMatch(/^ {2}admin-api:/mu)
    expect(validateUnifiedApiCaddyContract(caddyfile)).toEqual([])
    expect(apiEnvironmentTemplate).toContain(
      "API_ALLOWED_HOSTS={{ ([writing_app_api_host, 'api:4000'] | join(',')) | to_json }}"
    )
    expect(adminEnvironmentTemplate).toContain("API_BASE_URL=http://api:4000")
    expect(caddyEnvironmentTemplate).toContain(
      "API_HOST={{ writing_app_api_host | to_json }}"
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

    expect(deploymentTasks).toContain(
      "변경된 bind-mounted Caddyfile을 반영하도록 Caddy 재생성"
    )
    expect(deploymentTasks).toContain("profiles:\n          - operations")
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
      expect(playbook).toContain("state: absent")
    }
  })

  test("Ansible immutable image assertion은 suffix와 제어 문자를 거부한다", () => {
    const exactDigestSuffix = /@sha256:[0-9a-f]{64}(?![\s\S])/u
    const validImage = `ghcr.io/example/api@sha256:${"a".repeat(64)}`

    expect(validImage).toMatch(exactDigestSuffix)
    expect(`${validImage}-suffix`).not.toMatch(exactDigestSuffix)
    expect(`${validImage}\n`).not.toMatch(exactDigestSuffix)
  })

  test("Ansible production Host assertion은 정규 DNS FQDN만 허용한다", () => {
    const publicHostname =
      /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$(?![\s\S])/u

    for (const hostname of [
      "api.example.test",
      "api-admin.example.co.kr",
      "example.test",
    ]) {
      expect(hostname).toMatch(publicHostname)
    }
    for (const hostname of [
      "api:4000",
      "Api.example.test",
      "api..example.test",
      "api.example.test.",
      "api.example.test\n",
      "api.example.test/path",
      "-api.example.test",
      "api-.example.test",
      `${"a".repeat(64)}.example.test`,
    ]) {
      expect(hostname).not.toMatch(publicHostname)
    }
  })
})
