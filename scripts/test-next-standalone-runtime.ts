import { createConnection } from "node:net"
import { resolve } from "node:path"

type ApplicationName = "admin" | "web"

type ApplicationDefinition = {
  readonly name: ApplicationName
  readonly originVariable: "ADMIN_ORIGIN" | "WEB_ORIGIN"
  readonly port: number
  readonly publicAssetPath: string
  readonly scriptId: string
}

const repositoryRoot = resolve(import.meta.dir, "..")
const serverApiBaseUrl = "http://127.0.0.1:4300"
const requestTimeout = 10_000
const applications: readonly ApplicationDefinition[] = [
  {
    name: "web",
    originVariable: "WEB_ORIGIN",
    port: 3300,
    publicAssetPath: "/course-thumbnails/basic-sentence-writing.png",
    scriptId: "web-zod-jitless",
  },
  {
    name: "admin",
    originVariable: "ADMIN_ORIGIN",
    port: 3301,
    publicAssetPath: "/course-thumbnails/basic-sentence-writing.png",
    scriptId: "admin-zod-jitless",
  },
]

for (const application of applications) {
  await verifyStandaloneApplication(application)
}

async function verifyStandaloneApplication(
  application: ApplicationDefinition
): Promise<void> {
  if (await isPortListening(application.port)) {
    throw new Error(
      `${application.name} standalone 검증 port ${application.port}가 이미 사용 중입니다.`
    )
  }

  const origin = `http://127.0.0.1:${application.port}`
  const environment = {
    ...process.env,
    API_BASE_URL: serverApiBaseUrl,
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    PORT: String(application.port),
    [application.originVariable]: origin,
  }
  const serverProcess = Bun.spawn({
    cmd: ["node", "scripts/run-next-standalone.mjs", application.name],
    cwd: repositoryRoot,
    env: environment,
    stderr: "pipe",
    stdout: "pipe",
    windowsHide: true,
  })
  let output = ""
  const outputTasks = [
    collectProcessOutput(serverProcess.stdout, (chunk) => {
      output += chunk
    }),
    collectProcessOutput(serverProcess.stderr, (chunk) => {
      output += chunk
    }),
  ]
  let stoppedGracefully = false

  try {
    const healthResponse = await waitForHttpResponse(
      `${origin}/health`,
      serverProcess,
      20_000
    )
    assertHealthyCsp(healthResponse, application.name)

    const pageResponse = await fetch(`${origin}/login`, {
      signal: AbortSignal.timeout(requestTimeout),
    })
    const pageNonce = assertHealthyCsp(pageResponse, application.name)
    const html = await pageResponse.text()
    if (!html.includes(application.scriptId)) {
      throw new Error(
        `${application.name} health HTML에 Zod jitless bootstrap script가 없습니다.`
      )
    }
    if (!html.includes("__zod_globalConfig")) {
      throw new Error(
        `${application.name} health HTML에 Zod jitless 설정이 없습니다.`
      )
    }
    if (!html.includes(`nonce="${pageNonce}"`)) {
      throw new Error(
        `${application.name} health HTML의 script에 CSP nonce가 없습니다.`
      )
    }

    const staticAssetPath = readStaticAssetPath(html, application.name)
    await assertSuccessfulResponse(`${origin}${staticAssetPath}`, "static")
    await assertSuccessfulResponse(
      `${origin}${application.publicAssetPath}`,
      "public"
    )
  } finally {
    stoppedGracefully = await stopProcess(serverProcess)
    await Promise.all(outputTasks)
  }

  if (!stoppedGracefully) {
    throw new Error(
      `${application.name} standalone process가 graceful timeout 안에 종료되지 않았습니다.\n${output}`
    )
  }
  await waitForPortRelease(application.port, 5_000)
  if (/next start/iu.test(output)) {
    throw new Error(
      `${application.name} standalone 실행에서 next start 경고가 발생했습니다.\n${output}`
    )
  }

  console.log(`${application.name} standalone production runtime: 통과`)
}

function assertHealthyCsp(
  response: Response,
  applicationName: ApplicationName
): string {
  if (!response.ok) {
    throw new Error(
      `${applicationName} health 응답이 실패했습니다: ${response.status}`
    )
  }

  const policy = response.headers.get("Content-Security-Policy")
  if (policy === null) {
    throw new Error(`${applicationName} health 응답에 CSP가 없습니다.`)
  }
  if (!policy.includes("'strict-dynamic'")) {
    throw new Error(`${applicationName} production CSP가 strict하지 않습니다.`)
  }
  if (policy.includes("upgrade-insecure-requests")) {
    throw new Error(
      `${applicationName} localhost HTTP CSP가 insecure request를 승격합니다.`
    )
  }
  if (policy.includes("'unsafe-eval'")) {
    throw new Error(
      `${applicationName} production CSP가 unsafe-eval을 허용합니다.`
    )
  }

  const nonce = /'nonce-([^']+)'/u.exec(policy)?.[1]
  if (nonce === undefined) {
    throw new Error(`${applicationName} production CSP에 nonce가 없습니다.`)
  }

  return nonce
}

async function assertSuccessfulResponse(
  url: string,
  assetKind: "public" | "static"
): Promise<void> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(requestTimeout),
  })
  if (!response.ok) {
    throw new Error(
      `${assetKind} asset 응답이 실패했습니다: ${response.status} ${url}`
    )
  }
}

function readStaticAssetPath(
  html: string,
  applicationName: ApplicationName
): string {
  const match = /(?:href|src)="(\/_next\/static\/[^"]+)"/u.exec(html)
  if (match?.[1] === undefined) {
    throw new Error(
      `${applicationName} health HTML에서 static asset을 찾지 못했습니다.`
    )
  }

  return match[1].replaceAll("&amp;", "&")
}

async function waitForHttpResponse(
  url: string,
  serverProcess: Bun.Subprocess<"ignore", "pipe", "pipe">,
  timeout: number
): Promise<Response> {
  const deadline = performance.now() + timeout

  while (performance.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      throw new Error(
        `standalone process가 readiness 전에 ${serverProcess.exitCode}로 종료되었습니다.`
      )
    }

    try {
      return await fetch(url, {
        signal: AbortSignal.timeout(
          Math.max(1, Math.ceil(Math.min(1_000, deadline - performance.now())))
        ),
      })
    } catch {
      await Bun.sleep(200)
    }
  }

  throw new Error(
    `standalone readiness 대기 시간이 ${timeout}ms를 초과했습니다.`
  )
}

function isPortListening(port: number): Promise<boolean> {
  return new Promise((resolveListening) => {
    const socket = createConnection({ host: "127.0.0.1", port })
    const finish = (listening: boolean) => {
      socket.destroy()
      resolveListening(listening)
    }

    socket.setTimeout(500)
    socket.once("connect", () => finish(true))
    socket.once("error", () => finish(false))
    socket.once("timeout", () => finish(false))
  })
}

async function waitForPortRelease(
  port: number,
  timeout: number
): Promise<void> {
  const deadline = performance.now() + timeout
  while (performance.now() < deadline) {
    if (!(await isPortListening(port))) return
    await Bun.sleep(100)
  }

  throw new Error(`standalone 종료 후 port ${port}가 해제되지 않았습니다.`)
}

async function stopProcess(
  serverProcess: Bun.Subprocess<"ignore", "pipe", "pipe">
): Promise<boolean> {
  if (serverProcess.exitCode !== null) {
    await serverProcess.exited
    return true
  }

  serverProcess.kill()
  const exited = await Promise.race([
    serverProcess.exited.then(() => true),
    Bun.sleep(5_000).then(() => false),
  ])
  if (!exited) {
    serverProcess.kill("SIGKILL")
    await serverProcess.exited
    return false
  }

  return true
}

async function collectProcessOutput(
  stream: ReadableStream<Uint8Array<ArrayBuffer>>,
  append: (chunk: string) => void
): Promise<void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const result = await reader.read()
    if (result.done) break

    append(decoder.decode(result.value, { stream: true }))
  }

  const finalChunk = decoder.decode()
  if (finalChunk.length > 0) append(finalChunk)
}
