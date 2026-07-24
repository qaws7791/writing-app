import { readFile } from "node:fs/promises"
import path from "node:path"

const databaseUrl = readRequiredEnvironment("E2E_DATABASE_URL")
const e2eRunRoot = readRequiredEnvironment("E2E_RUN_ROOT")
const contentAssetRoot = path.resolve(e2eRunRoot, "content-assets")
const setupScripts = [
  "apps/api/src/scripts/setup-e2e-content-database.ts",
  "apps/api/src/scripts/setup-e2e-database.ts",
] as const

for (const setupScript of setupScripts) {
  const setup = Bun.spawn(["bun", setupScript], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      NODE_ENV: "test",
    },
    stderr: "inherit",
    stdout: "inherit",
  })

  if ((await setup.exited) !== 0) {
    throw new Error(`E2E fixture를 준비하지 못했습니다: ${setupScript}`)
  }
}

Bun.serve({
  async fetch(request) {
    const requestUrl = new URL(request.url)
    if (requestUrl.pathname === "/") return new Response("ready")
    if (!requestUrl.pathname.startsWith("/content-assets/")) {
      return new Response("not found", { status: 404 })
    }

    const target = path.resolve(
      e2eRunRoot,
      requestUrl.pathname.replace(/^\/+/u, "")
    )
    if (!target.startsWith(`${contentAssetRoot}${path.sep}`)) {
      return new Response("not found", { status: 404 })
    }

    try {
      return new Response(await readFile(target), {
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Type": readImageContentType(target),
        },
      })
    } catch {
      return new Response("not found", { status: 404 })
    }
  },
  hostname: "127.0.0.1",
  port: 4199,
})

function readImageContentType(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg"
    case ".png":
      return "image/png"
    case ".webp":
      return "image/webp"
    default:
      return "application/octet-stream"
  }
}

function readRequiredEnvironment(name: string): string {
  const value = process.env[name]?.trim()

  if (value === undefined || value.length === 0) {
    throw new Error(`${name}이 없어 E2E fixture를 준비할 수 없습니다.`)
  }

  return path.resolve(value)
}
