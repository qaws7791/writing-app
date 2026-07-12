export type LearnerApiServer = {
  readonly stop: (_closeActiveConnections?: boolean) => Promise<void> | void
}

export type LearnerApiShutdownPhase = "close-core" | "stop-server"

export function createLearnerApiServerLifecycle(input: {
  readonly closeCore: () => Promise<void> | void
  readonly fetch: (_request: Request) => Promise<Response> | Response
  readonly onShutdownError: (
    _error: unknown,
    _phase: LearnerApiShutdownPhase
  ) => void
}) {
  let activeRequestCount = 0
  let drain: Promise<void> | undefined
  let finishDrain: (() => void) | undefined
  let server: LearnerApiServer | undefined
  let shuttingDown = false
  let shutdownPromise: Promise<void> | undefined

  return {
    attachServer(attachedServer: LearnerApiServer): void {
      if (server !== undefined) {
        throw new Error(
          "학습자 API server lifecycle에 server가 이미 연결되었습니다."
        )
      }
      server = attachedServer
    },
    async fetch(request: Request): Promise<Response> {
      if (shuttingDown) {
        return Response.json(
          { code: "SERVICE_UNAVAILABLE", message: "서버가 종료 중입니다." },
          { status: 503 }
        )
      }

      activeRequestCount += 1
      try {
        return await input.fetch(request)
      } finally {
        activeRequestCount -= 1
        if (activeRequestCount === 0) finishDrain?.()
      }
    },
    shutdown(): Promise<void> {
      shutdownPromise ??= (async () => {
        shuttingDown = true
        if (activeRequestCount > 0) {
          drain = new Promise((resolve) => {
            finishDrain = resolve
          })
        }

        let stopServer: Promise<void>
        try {
          stopServer = Promise.resolve(server?.stop(false)).catch(
            (error: unknown) => input.onShutdownError(error, "stop-server")
          )
        } catch (error) {
          input.onShutdownError(error, "stop-server")
          stopServer = Promise.resolve()
        }
        await drain
        await stopServer

        try {
          await input.closeCore()
        } catch (error) {
          input.onShutdownError(error, "close-core")
        }
      })()
      return shutdownPromise
    },
  }
}

export function registerLearnerApiShutdownSignals(
  shutdown: () => Promise<void>,
  register: (_signal: "SIGINT" | "SIGTERM", _listener: () => void) => void = (
    signal,
    listener
  ) => process.once(signal, listener)
): void {
  const listener = () => void shutdown()
  register("SIGINT", listener)
  register("SIGTERM", listener)
}
