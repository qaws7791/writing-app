import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"

import {
  composeSmokeRoutes,
  createAdminSsrHealthCheckArguments,
  createAdminSsrHealthCheckScript,
  createCaddyRequestArguments,
  createContainerRunArguments,
  createComposeDownArguments,
  createComposeSmokeEnvironment,
  createComposeUpArguments,
  createHealthRequestScript,
  createImageBuildArguments,
  createRuntimeEnvironment,
  deploymentImageSpecs,
  isExpectedRuntimeUser,
  validateComposeSmokeServices,
} from "./test-deployment-images"

describe("production image smoke 계약", () => {
  test("세 앱의 linux/amd64 BuildKit build를 정의한다", () => {
    expect(deploymentImageSpecs.map((spec) => spec.name)).toEqual([
      "web",
      "api",
      "admin",
    ])

    for (const spec of deploymentImageSpecs) {
      const args = createImageBuildArguments(
        spec,
        `fixture/${spec.name}:test`,
        path.join("fixture", "repository")
      )
      expect(args.slice(0, 5)).toEqual([
        "buildx",
        "build",
        "--load",
        "--platform",
        "linux/amd64",
      ])
      expect(args).toContain(
        path.join("fixture", "repository", spec.dockerfile)
      )
    }
  })

  test("컨테이너는 host port 없이 격리하고 DB 앱만 volume을 연결한다", () => {
    for (const spec of deploymentImageSpecs) {
      const args = createContainerRunArguments(
        spec,
        `fixture/${spec.name}:test`,
        `fixture-${spec.name}`,
        "/fixture/data",
        [["NODE_ENV", "production"]]
      )

      expect(args).toContain("none")
      expect(args).not.toContain("--publish")
      expect(args).not.toContain("-p")
      expect(args.includes("--mount")).toBe(spec.usesDatabase)
    }
  })

  test("명시적인 비 root image user만 허용한다", () => {
    expect(isExpectedRuntimeUser("10001:10001\n")).toBe(true)
    expect(isExpectedRuntimeUser("")).toBe(false)
    expect(isExpectedRuntimeUser("root")).toBe(false)
    expect(isExpectedRuntimeUser("10001")).toBe(false)
  })

  test("인증 secret은 API 컨테이너에만 전달한다", () => {
    for (const spec of deploymentImageSpecs) {
      const names = createRuntimeEnvironment(
        spec,
        "learner-fixture",
        "admin-fixture"
      ).map(([name]) => name)

      expect(names.includes("LEARNER_AUTH_SECRET")).toBe(spec.usesDatabase)
      expect(names.includes("ADMIN_AUTH_SECRET")).toBe(spec.usesDatabase)
    }
  })

  test("통합 API smoke는 configured API Host로 health를 요청한다", () => {
    const apiSpec = deploymentImageSpecs.find((spec) => spec.name === "api")
    expect(apiSpec).toBeDefined()
    if (apiSpec === undefined) return

    const environment = new Map(
      createRuntimeEnvironment(apiSpec, "learner-fixture", "admin-fixture")
    )
    const healthScript = createHealthRequestScript(apiSpec)

    expect(environment.get("API_ALLOWED_HOSTS")).toBe(
      "api.example.test,api:4000"
    )
    expect(environment.get("ADMIN_AUTH_SECRET")).toBe("admin-fixture")
    expect(environment.get("ADMIN_ASSET_PUBLIC_BASE_URL")).toBe(
      "https://assets.example.test"
    )
    expect(environment.get("API_ORIGIN")).toBe("https://api.example.test")
    expect(environment.get("ADMIN_ORIGIN")).toBe("https://admin.example.test")
    expect(environment.get("LEARNER_AUTH_COOKIE_DOMAIN")).toBe("example.test")
    expect(environment.get("ADMIN_AUTH_COOKIE_DOMAIN")).toBe("example.test")
    expect(healthScript).toContain("Host:new URL(process.env.API_ORIGIN).host")
    expect(healthScript).toContain("http://127.0.0.1:4000/health")
  })

  test("Admin SSR은 단일 API upstream을 호출한다", () => {
    const adminSpec = deploymentImageSpecs.find((spec) => spec.name === "admin")
    expect(adminSpec).toBeDefined()
    if (adminSpec === undefined) return

    const environment = new Map(
      createRuntimeEnvironment(adminSpec, "learner-fixture", "admin-fixture")
    )

    expect(environment.get("API_BASE_URL")).toBe("http://api:4000")
  })

  test("Compose smoke는 task 전용 project에서 local image만 기동하고 정리한다", () => {
    const command = {
      composeEnvironmentPath: "/fixture/compose.env",
      composePath: "/fixture/compose.yaml",
      projectName: "writing-app-smoke-fixture",
    }

    expect(createComposeUpArguments(command)).toEqual([
      "compose",
      "--project-name",
      "writing-app-smoke-fixture",
      "--env-file",
      "/fixture/compose.env",
      "--file",
      "/fixture/compose.yaml",
      "up",
      "--detach",
      "--wait",
      "--wait-timeout",
      "90",
      "--no-build",
      "--pull",
      "never",
      "caddy",
    ])
    expect(createComposeDownArguments(command)).toEqual([
      "compose",
      "--project-name",
      "writing-app-smoke-fixture",
      "--env-file",
      "/fixture/compose.env",
      "--file",
      "/fixture/compose.yaml",
      "down",
      "--remove-orphans",
      "--volumes",
    ])
    expect(
      createComposeSmokeEnvironment({
        backupDirectory: "/fixture/backups",
        caddyImage: "writing-app-smoke-caddy:fixture",
        configDirectory: "/fixture/config",
        dataDirectory: "/fixture/data",
        images: {
          admin: "writing-app-smoke-admin:fixture",
          api: "writing-app-smoke-api:fixture",
          web: "writing-app-smoke-web:fixture",
        },
        runId: "fixture",
        secretsDirectory: "/fixture/secrets",
      })
    ).toEqual([
      "WEB_IMAGE=writing-app-smoke-web:fixture",
      "API_IMAGE=writing-app-smoke-api:fixture",
      "ADMIN_IMAGE=writing-app-smoke-admin:fixture",
      "CADDY_IMAGE=writing-app-smoke-caddy:fixture",
      "CLOUDFLARED_IMAGE=writing-app-smoke-cloudflared-unused:fixture",
      "LITESTREAM_IMAGE=writing-app-smoke-litestream-unused:fixture",
      "CONFIG_DIRECTORY=/fixture/config",
      "SECRETS_DIRECTORY=/fixture/secrets",
      "DATA_DIRECTORY=/fixture/data",
      "BACKUP_DIRECTORY=/fixture/backups",
    ])
  })

  test("Compose smoke는 Caddy 내부에서 public Host별 target route를 요청한다", () => {
    const command = {
      composeEnvironmentPath: "/fixture/compose.env",
      composePath: "/fixture/compose.yaml",
      projectName: "writing-app-smoke-fixture",
    }

    expect(composeSmokeRoutes).toEqual([
      {
        expectedResponse: { ok: true, service: "web" },
        host: "web.example.test",
        path: "/health",
      },
      {
        expectedResponse: { ok: true },
        host: "api.example.test",
        path: "/health",
      },
      {
        expectedResponse: { ok: true, service: "admin" },
        host: "admin.example.test",
        path: "/health",
      },
    ])

    for (const route of composeSmokeRoutes) {
      const args = createCaddyRequestArguments(command, route.host, route.path)
      expect(args).toContain("exec")
      expect(args).toContain("caddy")
      expect(args).toContain(`Host: ${route.host}`)
      expect(args).toContain("http://127.0.0.1:8080/health")
      expect(args).not.toContain("--publish")
    }
  })

  test("Admin SSR 내부 health 요청은 단일 API의 관리자 namespace를 사용한다", () => {
    const command = {
      composeEnvironmentPath: "/fixture/compose.env",
      composePath: "/fixture/compose.yaml",
      projectName: "writing-app-smoke-fixture",
    }
    const args = createAdminSsrHealthCheckArguments(command)
    const script = createAdminSsrHealthCheckScript()

    expect(args).toEqual(
      expect.arrayContaining(["exec", "-T", "admin", "node", "-e", script])
    )
    expect(script).toContain("http://api:4000")
    expect(script).toContain("/api/admin/health")
    expect(script).toContain("body?.service!=='api'")
  })

  test("Compose smoke는 정의 밖 service가 실행되면 실패한다", () => {
    expect(validateComposeSmokeServices("api\nadmin\ncaddy\nweb\n")).toEqual([])
    expect(
      validateComposeSmokeServices(
        "api\nadmin\nadmin-api\ncaddy\ncloudflared\nweb\n"
      )
    ).toEqual([
      "admin-api: Compose smoke 외부 service를 실행하면 안 됩니다.",
      "cloudflared: Compose smoke 외부 service를 실행하면 안 됩니다.",
    ])
  })

  test("Admin image는 모든 코스 썸네일과 정적 HTTP 계약을 포함한다", () => {
    const adminSpec = deploymentImageSpecs.find((spec) => spec.name === "admin")
    expect(adminSpec).toBeDefined()
    expect(
      adminSpec?.staticPaths.filter((staticPath) =>
        staticPath.includes("/public/course-thumbnails/")
      )
    ).toHaveLength(5)
    expect(adminSpec?.staticResponses).toHaveLength(5)

    for (const response of adminSpec?.staticResponses ?? []) {
      expect(response.cacheControl).toBe("public, max-age=31536000, immutable")
      expect(response.contentType).toBe("image/png")
    }
  })

  test("Admin image는 제한된 worker로 Webpack production build를 실행한다", () => {
    const dockerfile = readFileSync(
      path.resolve(import.meta.dir, "../deploy/docker/admin.dockerfile"),
      "utf8"
    )
    const nextConfig = readFileSync(
      path.resolve(import.meta.dir, "../apps/admin/next.config.ts"),
      "utf8"
    )
    const adminBuildSteps = dockerfile
      .split("\n")
      .filter((line) => line.startsWith("RUN bun --filter @workspace/admin"))

    expect(adminBuildSteps).toEqual([
      "RUN bun --filter @workspace/admin build --webpack",
    ])
    expect(dockerfile).not.toContain("ignoreBuildErrors")
    expect(nextConfig).toContain("cpus: 1")
  })
})
