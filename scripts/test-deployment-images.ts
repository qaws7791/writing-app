import { spawnSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import {
  readContainerImageLock,
  requireLockedContainerImageReference,
} from "#scripts/check-container-image-lock"
import { readImageReleaseManifest } from "#scripts/image-release-metadata"

type Service = "admin" | "api" | "web"
type Environment = Readonly<Record<string, string>>

interface DeploymentImageSpec {
  readonly buildArguments: Environment
  readonly dockerfile: string
  readonly environment: Environment
  readonly name: Service
}

interface DockerResult {
  readonly stderr: string
  readonly stdout: string
  readonly success: boolean
}

const repositoryRoot = path.resolve(import.meta.dir, "..")
const runtimeSecrets = [
  "ADMIN_ASSET_S3_ACCESS_KEY",
  "ADMIN_ASSET_S3_SECRET_KEY",
  "ADMIN_AUTH_SECRET",
  "CURSOR_SIGNING_SECRET",
  "DELETION_MARKER_S3_ACCESS_KEY",
  "DELETION_MARKER_S3_SECRET_KEY",
  "GOOGLE_CLIENT_SECRET",
  "LEARNER_AUTH_SECRET",
  "RESEND_API_KEY",
] as const
const routes = [
  ["web.example.test", "/health"],
  ["web.example.test", "/api/health"],
  ["admin.example.test", "/health"],
  ["admin.example.test", "/api/admin/health"],
] as const

function createSpecs(
  learnerSecret: string,
  adminSecret: string
): readonly DeploymentImageSpec[] {
  const publicEnvironment = {
    ADMIN_ORIGIN: "https://admin.example.test",
    CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS:
      "https://staging-assets.example.test,https://assets.example.test",
    CONTENT_ASSET_PUBLIC_BASE_URL: "https://assets.example.test",
    NODE_ENV: "production",
    WEB_ORIGIN: "https://web.example.test",
  }
  const apiEnvironment = {
    ...publicEnvironment,
    ADMIN_ASSET_PUBLIC_BASE_URL: "https://assets.example.test",
    ADMIN_ASSET_S3_ACCESS_KEY: "asset-access-key",
    ADMIN_ASSET_S3_BUCKET: "writing-app-assets",
    ADMIN_ASSET_S3_ENDPOINT: "https://r2.example.test",
    ADMIN_ASSET_S3_REGION: "auto",
    ADMIN_ASSET_S3_SECRET_KEY: "asset-secret-key",
    ADMIN_AUTH_SECRET: adminSecret,
    API_PORT: "4000",
    AUTH_EMAIL_FROM: "Writing App <auth@example.test>",
    AUTH_EMAIL_REPLY_TO: "support@example.test",
    CURSOR_SIGNING_SECRET: `${learnerSecret}-cursor-distinct`,
    DATABASE_URL: "file:/var/lib/writing-app/api.sqlite",
    DELETION_MARKER_S3_ACCESS_KEY: "marker-access-key",
    DELETION_MARKER_S3_BUCKET: "writing-app-deletion-markers",
    DELETION_MARKER_S3_ENDPOINT: "https://private-s3.example.test",
    DELETION_MARKER_S3_PREFIX: "privacy/deletion-markers",
    DELETION_MARKER_S3_REGION: "auto",
    DELETION_MARKER_S3_SECRET_KEY: "marker-secret-key",
    DEPLOYMENT_VERSION: "writing-app-smoke-api@sha256:test",
    GOOGLE_CLIENT_ID: "google-smoke-client-id",
    GOOGLE_CLIENT_SECRET: "google-smoke-client-secret",
    LEARNER_AUTH_SECRET: learnerSecret,
    LOG_PRETTY: "false",
    RESEND_API_KEY: "resend-smoke-api-key",
  }
  const assetOrigins = publicEnvironment.CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS
  return [
    {
      buildArguments: {
        API_BASE_URL: "http://api:4000",
        CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS: assetOrigins,
        WEB_ORIGIN: publicEnvironment.WEB_ORIGIN,
      },
      dockerfile: "deploy/docker/web.dockerfile",
      environment: {
        ...publicEnvironment,
        API_BASE_URL: "http://api:4000",
        PORT: "3000",
      },
      name: "web",
    },
    {
      buildArguments: {},
      dockerfile: "deploy/docker/api.dockerfile",
      environment: apiEnvironment,
      name: "api",
    },
    {
      buildArguments: {
        ADMIN_ORIGIN: publicEnvironment.ADMIN_ORIGIN,
        API_BASE_URL: "http://api:4000",
        CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS: assetOrigins,
        NEXT_PUBLIC_LEARNER_WEB_ORIGIN: publicEnvironment.WEB_ORIGIN,
      },
      dockerfile: "deploy/docker/admin.dockerfile",
      environment: {
        ...publicEnvironment,
        API_BASE_URL: "http://api:4000",
        NEXT_PUBLIC_LEARNER_WEB_ORIGIN: publicEnvironment.WEB_ORIGIN,
        PORT: "3001",
      },
      name: "admin",
    },
  ]
}

function docker(
  args: readonly string[],
  options: { readonly capture?: boolean; readonly required?: boolean } = {}
): DockerResult {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    env: { ...process.env, DOCKER_BUILDKIT: "1" },
    stdio: options.capture ? "pipe" : "inherit",
    windowsHide: true,
  })
  const value = {
    stderr: typeof result.stderr === "string" ? result.stderr : "",
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    success: result.error === undefined && result.status === 0,
  }
  if (options.required !== false && !value.success) {
    throw new Error(
      value.stderr.trim() ||
        result.error?.message ||
        `docker 명령이 exit code ${result.status ?? "unknown"}로 실패했습니다.`
    )
  }
  return value
}

function compose(
  fixture: { readonly env: string; readonly project: string },
  args: readonly string[],
  options?: { readonly capture?: boolean; readonly required?: boolean }
): DockerResult {
  return docker(
    [
      "compose",
      "--project-name",
      fixture.project,
      "--env-file",
      fixture.env,
      "--file",
      path.join(repositoryRoot, "deploy", "compose", "compose.yaml"),
      ...args,
    ],
    options
  )
}

function writeEnvironment(filePath: string, environment: Environment): void {
  fs.writeFileSync(
    filePath,
    `${Object.entries(environment)
      .map(([name, value]) => `${name}=${value}`)
      .join("\n")}\n`
  )
}

function assertImageContract(image: string): void {
  const inspect = (format: string) =>
    docker(["image", "inspect", "--format", format, image], {
      capture: true,
    }).stdout.trim()
  if (inspect("{{.Config.User}}") !== "10001:10001") {
    throw new Error(`${image}: runtime user는 10001:10001이어야 합니다.`)
  }
  const bakedInput =
    inspect("{{json .Config.Env}}") +
    docker(["history", "--no-trunc", "--format", "{{.CreatedBy}}", image], {
      capture: true,
    }).stdout
  for (const secret of runtimeSecrets) {
    if (bakedInput.includes(`${secret}=`) || bakedInput.includes(secret)) {
      throw new Error(
        `${image}: ${secret}은 image config나 build history에 포함되면 안 됩니다.`
      )
    }
  }
}

function buildImage(spec: DeploymentImageSpec, image: string): void {
  docker([
    "buildx",
    "build",
    "--load",
    "--platform",
    "linux/amd64",
    "--file",
    path.join(repositoryRoot, spec.dockerfile),
    "--tag",
    image,
    ...Object.entries(spec.buildArguments).flatMap(([name, value]) => [
      "--build-arg",
      `${name}=${value}`,
    ]),
    repositoryRoot,
  ])
}

function createFixture(
  specs: readonly DeploymentImageSpec[],
  images: Readonly<Record<Service, string>>,
  caddyImage: string,
  runId: string
) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "writing-app-images-"))
  try {
    const config = path.join(root, "config")
    const caddySites = path.join(config, "caddy-sites")
    const data = path.join(root, "data")
    const backups = path.join(root, "backups")
    for (const directory of [config, data, backups]) fs.mkdirSync(directory)
    fs.mkdirSync(caddySites)
    fs.writeFileSync(path.join(caddySites, "admin-mcp.caddy"), "")
    fs.chmodSync(data, 0o777)
    for (const spec of specs) {
      writeEnvironment(path.join(config, `${spec.name}.env`), spec.environment)
    }
    writeEnvironment(path.join(config, "caddy.env"), {
      ADMIN_HOST: "admin.example.test",
      WEB_HOST: "web.example.test",
    })
    writeEnvironment(path.join(config, "litestream.env"), {
      LITESTREAM_ACCESS_KEY_ID: "smoke-access-key",
      LITESTREAM_BUCKET: "writing-app-smoke",
      LITESTREAM_ENDPOINT: "https://example.invalid",
      LITESTREAM_PATH: "api.sqlite",
      LITESTREAM_SECRET_ACCESS_KEY: "smoke-secret-key",
    })
    fs.copyFileSync(
      path.join(repositoryRoot, "deploy", "caddy", "caddyfile"),
      path.join(config, "caddyfile")
    )
    fs.copyFileSync(
      path.join(repositoryRoot, "deploy", "litestream", "litestream.yaml"),
      path.join(config, "litestream.yaml")
    )
    const env = path.join(root, "compose.env")
    writeEnvironment(env, {
      ADMIN_IMAGE: images.admin,
      API_IMAGE: images.api,
      BACKUP_DIRECTORY: backups.replaceAll("\\", "/"),
      CADDY_IMAGE: caddyImage,
      CONFIG_DIRECTORY: config.replaceAll("\\", "/"),
      DATA_DIRECTORY: data.replaceAll("\\", "/"),
      LITESTREAM_IMAGE: `writing-app-smoke-litestream-unused:${runId}`,
      WEB_IMAGE: images.web,
    })
    return {
      env,
      project: `writing-app-smoke-${runId}`,
      root,
    }
  } catch (error) {
    fs.rmSync(root, { force: true, recursive: true })
    throw error
  }
}

function nodeCheck(
  fixture: { readonly env: string; readonly project: string },
  service: Service,
  script: string
) {
  compose(fixture, ["exec", "-T", service, "node", "-e", script])
}

function bunCheck(
  fixture: { readonly env: string; readonly project: string },
  service: Service,
  script: string
) {
  compose(fixture, ["exec", "-T", service, "bun", "-e", script])
}

function smokeCompose(
  specs: readonly DeploymentImageSpec[],
  images: Readonly<Record<Service, string>>,
  caddyImage: string,
  runId: string
): void {
  const fixture = createFixture(specs, images, caddyImage, runId)
  let failure: unknown
  try {
    compose(fixture, [
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
    for (const [host, route] of routes) {
      compose(fixture, [
        "exec",
        "-T",
        "caddy",
        "wget",
        "-q",
        "-O",
        "/dev/null",
        "--header",
        `Host: ${host}`,
        `http://127.0.0.1:8080${route}`,
      ])
    }
    nodeCheck(
      fixture,
      "admin",
      "fetch(process.env.API_BASE_URL+'/api/admin/health').then(async r=>{const b=await r.json();if(!r.ok||b.service!=='api')throw Error(JSON.stringify(b))}).catch(e=>{console.error(e);process.exit(1)})"
    )
    bunCheck(
      fixture,
      "api",
      "const{accessSync,constants}=require('node:fs');for(const p of ['/workspace/bin/admin-mcp-token-issue','/workspace/bin/admin-mcp-token-revoke'])accessSync(p,constants.X_OK)"
    )
    for (const [service, port] of [
      ["web", 3000],
      ["admin", 3001],
    ] as const) {
      nodeCheck(
        fixture,
        service,
        `(async()=>{const o='http://127.0.0.1:${port}',p='/course-thumbnails/expression.png',s=await fetch(o+p),i=await fetch(o+'/_next/image?url='+encodeURIComponent(p)+'&w=640&q=75'),a=Buffer.from(await s.arrayBuffer()),b=Buffer.from(await i.arrayBuffer());if(!s.ok||!i.ok||b.length>=a.length)throw Error('image optimizer smoke failed')})().catch(e=>{console.error(e);process.exit(1)})`
      )
    }
  } catch (error) {
    const logs = compose(
      fixture,
      ["logs", "--no-color", "api", "admin", "caddy", "web"],
      {
        capture: true,
        required: false,
      }
    )
    failure = new Error(
      `${error instanceof Error ? error.message : String(error)}\n${logs.stdout}${logs.stderr}`
    )
  } finally {
    const cleanup = compose(
      fixture,
      ["down", "--remove-orphans", "--volumes"],
      {
        capture: true,
        required: false,
      }
    )
    fs.rmSync(fixture.root, { force: true, recursive: true })
    if (!cleanup.success && failure === undefined) {
      failure = new Error(
        `Compose smoke project 정리에 실패했습니다.\n${cleanup.stderr}`
      )
    }
  }
  if (failure !== undefined) throw failure
}

async function run(): Promise<void> {
  const argument = process.argv.slice(2)
  if (
    argument.length !== 0 &&
    (argument.length !== 2 || argument[0] !== "released")
  ) {
    throw new Error(
      "released <image-release-manifest.json> 형식으로 실행해야 합니다."
    )
  }
  const manifest = argument[1]
    ? readImageReleaseManifest(path.resolve(argument[1]))
    : undefined
  const runId = `${process.pid}-${Date.now()}`
  const learnerSecret = `0123456789abcdef${randomBytes(32).toString("hex")}`
  const adminSecret = `fedcba9876543210${randomBytes(32).toString("hex")}`
  const specs = createSpecs(learnerSecret, adminSecret)
  const owned = new Set<string>()
  const images = {} as Record<Service, string>

  docker(["info", "--format", "{{.ServerVersion}}"])
  try {
    for (const spec of specs) {
      const image =
        manifest?.images[spec.name] ?? `writing-app-smoke-${spec.name}:${runId}`
      owned.add(image)
      if (manifest) docker(["pull", "--platform", "linux/amd64", image])
      else buildImage(spec, image)
      assertImageContract(image)
      images[spec.name] = image
    }
    const lock = readContainerImageLock(repositoryRoot)
    const lockedCaddy = requireLockedContainerImageReference(lock, "caddy")
    const caddyImage = `writing-app-smoke-caddy:${runId}`
    owned.add(caddyImage)
    docker(["pull", lockedCaddy])
    docker(["image", "tag", lockedCaddy, caddyImage])
    smokeCompose(specs, images, caddyImage, runId)
  } finally {
    for (const image of owned)
      docker(["image", "rm", "--force", image], { required: false })
  }
  console.log(
    "세 production image와 실제 Compose traffic smoke를 통과했습니다."
  )
}

if (import.meta.main) {
  try {
    await run()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
