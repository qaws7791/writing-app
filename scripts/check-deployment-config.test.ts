import { describe, expect, test } from "bun:test"

import { validateComposeContract } from "./check-deployment-config"

const healthcheck = { test: ["CMD", "true"] }
const sqliteVolume = [{ target: "/var/lib/writing-app", type: "bind" }]

function createValidComposeConfig(): unknown {
  return {
    services: {
      admin: { healthcheck, init: true, networks: { admin: null } },
      "admin-api": {
        healthcheck,
        init: true,
        networks: { admin: null },
        volumes: sqliteVolume,
      },
      api: {
        healthcheck,
        init: true,
        networks: { learner: null },
        volumes: sqliteVolume,
      },
      caddy: {
        networks: { admin: null, edge: null, learner: null },
      },
      cloudflared: { networks: { edge: null } },
      "database-backup": {},
      "database-check": {},
      "database-migrate": {},
      "database-restore": {},
      litestream: {
        networks: { backup: null },
        volumes: sqliteVolume,
      },
      web: { healthcheck, init: true, networks: { learner: null } },
    },
  }
}

describe("배포 Compose 계약", () => {
  test("현재 서비스와 격리 경계가 충족되면 통과한다", () => {
    expect(validateComposeContract(createValidComposeConfig())).toEqual([])
  })

  test("필수 서비스 누락을 거부한다", () => {
    const config = createValidComposeConfig() as {
      services: { cloudflared?: unknown }
    }
    delete config.services.cloudflared

    expect(validateComposeContract(config)).toContain(
      "Compose service cloudflared이(가) 없습니다."
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
      services: {
        api: {
          healthcheck: unknown
          init: boolean
          networks: object
          volumes: readonly unknown[]
        }
      }
    }
    config.services.api.networks = { edge: null, learner: null }
    config.services.api.volumes = []

    expect(validateComposeContract(config)).toEqual(
      expect.arrayContaining([
        "api: network는 learner만 사용해야 합니다.",
        "api: 공유 SQLite volume이 필요합니다.",
      ])
    )
  })
})
