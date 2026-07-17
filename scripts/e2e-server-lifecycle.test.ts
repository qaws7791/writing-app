import { createConnection, createServer } from "node:net"

import { expect, test } from "bun:test"

import {
  startE2eServers,
  stopE2eServers,
  type E2eServerDefinition,
  type StartedE2eServer,
} from "#scripts/e2e-server-lifecycle"

const lifecycleOptions = {
  pollIntervalMilliseconds: 25,
  readinessTimeoutMilliseconds: 5_000,
  shutdownTimeoutMilliseconds: 5_000,
} as const

test("E2E runner가 직접 시작한 server process group을 종료한다", async () => {
  const port = await findAvailablePort()
  let servers: readonly StartedE2eServer[] = []

  try {
    servers = await startE2eServers(
      [createListeningServerDefinition("정상 server", port)],
      lifecycleOptions
    )

    expect(await isPortListening(port)).toBe(true)
  } finally {
    await stopE2eServers(servers, lifecycleOptions)
  }

  expect(await waitForPortRelease(port)).toBe(true)
}, 15_000)

test("E2E server 준비 실패도 이미 시작한 소유 process group을 종료한다", async () => {
  const listeningPort = await findAvailablePort()
  const unavailablePort = await findAvailablePort()

  await expect(
    startE2eServers(
      [
        createListeningServerDefinition("먼저 시작한 server", listeningPort),
        {
          command: [process.execPath, "--eval", "process.exit(17)"],
          cwd: process.cwd(),
          env: { ...process.env },
          name: "준비 실패 server",
          readinessUrl: `http://127.0.0.1:${unavailablePort}`,
        },
      ],
      lifecycleOptions
    )
  ).rejects.toThrow("준비 전에 종료되었습니다")

  expect(await waitForPortRelease(listeningPort)).toBe(true)
}, 15_000)

function createListeningServerDefinition(
  name: string,
  port: number
): E2eServerDefinition {
  return {
    command: [
      process.execPath,
      "--eval",
      `Bun.serve({ fetch: () => new Response("ready"), hostname: "127.0.0.1", port: ${port} }); await new Promise(() => {})`,
    ],
    cwd: process.cwd(),
    env: { ...process.env },
    name,
    readinessUrl: `http://127.0.0.1:${port}`,
  }
}

async function findAvailablePort(): Promise<number> {
  const server = createServer()

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })

  const address = server.address()
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error === undefined ? resolve() : reject(error)))
  })

  if (address === null || typeof address === "string") {
    throw new Error("사용 가능한 E2E test port를 찾지 못했습니다.")
  }

  return address.port
}

async function waitForPortRelease(port: number): Promise<boolean> {
  const deadline = performance.now() + 5_000

  while (performance.now() < deadline) {
    if (!(await isPortListening(port))) return true
    await Bun.sleep(25)
  }

  return !(await isPortListening(port))
}

function isPortListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port })
    const finish = (listening: boolean) => {
      socket.destroy()
      resolve(listening)
    }

    socket.setTimeout(500)
    socket.once("connect", () => finish(true))
    socket.once("error", () => finish(false))
    socket.once("timeout", () => finish(false))
  })
}
