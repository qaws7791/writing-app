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
  createImageOptimizationRequestScript,
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

  test("runtime image는 대상 밖 workspace source를 포함하지 않는다", () => {
    const api = deploymentImageSpecs.find((spec) => spec.name === "api")
    const web = deploymentImageSpecs.find((spec) => spec.name === "web")
    const admin = deploymentImageSpecs.find((spec) => spec.name === "admin")

    expect(api?.runtimeArtifactPaths).toEqual([
      "/workspace/bin/api",
      "/workspace/bin/database-backup",
      "/workspace/bin/database-migrate",
      "/workspace/node_modules/prismjs/package.json",
    ])
    expect(api?.forbiddenPaths).toEqual(
      expect.arrayContaining(["/workspace/apps", "/workspace/packages"])
    )
    expect(web?.forbiddenPaths).toContain("/workspace/packages/modules")
    expect(admin?.forbiddenPaths).toContain("/workspace/packages/modules")
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
    expect(environment.get("DEPLOYMENT_VERSION")).toBe(
      "writing-app-smoke-api@sha256:test"
    )
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
        expectedResponse: {
          checks: { database: "ready" },
          impact: "none",
          ok: true,
        },
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

  test("web과 admin image는 원본과 다른 축소 image optimizer 응답을 검증한다", () => {
    for (const name of ["web", "admin"] as const) {
      const spec = deploymentImageSpecs.find(
        (candidate) => candidate.name === name
      )
      expect(spec).toBeDefined()
      if (spec === undefined) continue

      expect(spec.optimizedImagePath).toBe("/course-thumbnails/expression.png")
      const script = createImageOptimizationRequestScript(spec)
      expect(script).toContain("/_next/image?")
      expect(script).toContain("w=640")
      expect(script).toContain("optimized.length>=source.length")
      expect(script).toContain("optimized.equals(source)")
    }
  })

  test("두 Next app은 server 준비 전에 위험 decoder를 차단한다", () => {
    const repositoryRoot = path.resolve(import.meta.dir, "..")
    const policySource = readFileSync(
      path.join(
        repositoryRoot,
        "packages/config/nextjs-config/src/image-optimizer-security.ts"
      ),
      "utf8"
    )

    expect(policySource).toContain("imageOptimizer.block")
    for (const operation of [
      "VipsForeignLoadNsgif",
      "VipsForeignLoadTiff",
      "VipsForeignLoadVips",
    ]) {
      expect(policySource).toContain(operation)
    }

    for (const app of ["web", "admin"] as const) {
      const instrumentation = readFileSync(
        path.join(repositoryRoot, "apps", app, "src", "instrumentation.ts"),
        "utf8"
      )
      expect(instrumentation).toContain('process.env.NEXT_RUNTIME !== "nodejs"')
      expect(instrumentation).toContain('import("sharp")')
      expect(instrumentation).toContain(
        "applyImageOptimizerSecurityPolicy(sharp)"
      )
    }
  })

  test("두 Next image는 제한된 worker를 사용하고 Admin은 Webpack으로 빌드한다", () => {
    const dockerfile = readFileSync(
      path.resolve(import.meta.dir, "../deploy/docker/admin.dockerfile"),
      "utf8"
    )
    const adminNextConfig = readFileSync(
      path.resolve(import.meta.dir, "../apps/admin/next.config.ts"),
      "utf8"
    )
    const adminBuildSteps = dockerfile
      .split("\n")
      .filter((line) => line.startsWith("RUN cd apps/admin"))

    expect(adminBuildSteps).toEqual([
      "RUN cd apps/admin && node node_modules/next/dist/bin/next build --webpack",
    ])
    expect(dockerfile).not.toContain("ignoreBuildErrors")
    expect(adminNextConfig).toContain("cpus: 1")
    expect(
      readFileSync(
        path.resolve(import.meta.dir, "../apps/web/next.config.ts"),
        "utf8"
      )
    ).toContain("cpus: 1")
  })

  test("세 Docker build는 isolated filtered install과 최소 runtime stage를 유지한다", () => {
    const repositoryRoot = path.resolve(import.meta.dir, "..")
    expect(
      readFileSync(path.join(repositoryRoot, ".dockerignore"), "utf8")
    ).toMatch(/^scripts$/mu)

    for (const service of ["web", "api", "admin"] as const) {
      const dockerfile = readFileSync(
        path.join(repositoryRoot, "deploy", "docker", `${service}.dockerfile`),
        "utf8"
      )
      expect(dockerfile).toContain("COPY . .")
      expect(dockerfile).toContain(
        "COPY --parents package.json bun.lock apps/*/package.json packages/*/*/package.json ./"
      )
      expect(dockerfile).not.toContain(" packages/*/package.json ")
      expect(dockerfile).toContain(
        `--filter @workspace/${service} --linker isolated --frozen-lockfile`
      )
      expect(dockerfile).toContain("FROM --platform=$BUILDPLATFORM")
      expect(dockerfile).toContain(
        "--mount=type=cache,target=/root/.bun/install/cache"
      )
      expect(dockerfile.indexOf("bun install")).toBeLessThan(
        dockerfile.indexOf("COPY . .")
      )

      if (service !== "api") {
        expect(dockerfile).toContain("--cpu='*' --os=linux")
        expect(dockerfile).toContain(" AS bun")
        expect(dockerfile).toContain(
          "COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun"
        )
        expect(dockerfile).toContain(
          `RUN cd apps/${service} && node node_modules/next/dist/bin/next build`
        )
      }

      const runner = dockerfile.slice(dockerfile.lastIndexOf(" AS runner"))
      expect(runner).not.toContain("COPY . .")
    }

    const apiDockerfile = readFileSync(
      path.join(repositoryRoot, "deploy", "docker", "api.dockerfile"),
      "utf8"
    )
    expect(apiDockerfile).toContain(
      "bun build --target=bun --external=prismjs --external='prismjs/*' apps/api/src/main.ts --outfile /workspace/image-bin/api"
    )
    expect(apiDockerfile).toContain(
      "COPY --from=builder --chown=10001:10001 /workspace/image-bin/ ./bin/"
    )
    expect(
      apiDockerfile.slice(apiDockerfile.lastIndexOf(" AS runner"))
    ).not.toContain("/workspace/apps/api")
  })
})
