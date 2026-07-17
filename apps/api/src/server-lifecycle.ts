export type UnifiedApiServer = {
  readonly stop: (_closeActiveConnections?: boolean) => Promise<void> | void
}

export type LearnerApiServer = UnifiedApiServer

export type UnifiedApiShutdownPhase =
  | "cancel-activity"
  | "cleanup-external"
  | "close-database"
  | "force-stop-server"
  | "stop-server"

export type LearnerApiShutdownPhase = "close-core" | "stop-server"

export type ServerLifecycleScheduledTask = {
  readonly cancel: () => void
}

export type ServerLifecycleScheduler = {
  readonly schedule: (
    _delayMilliseconds: number,
    _task: () => void
  ) => ServerLifecycleScheduledTask
}

export type LongLivedActivityLease = {
  readonly label: string
  readonly release: () => void
  readonly signal: AbortSignal
}

export type UnifiedApiServerLifecycle = {
  readonly acquireLongLivedLease: (_label: string) => LongLivedActivityLease
  readonly attachServer: (_server: UnifiedApiServer) => void
  readonly fetch: (_request: Request) => Promise<Response>
  readonly shutdown: () => Promise<void>
}

type ActiveActivity = {
  abortController: AbortController
  cancelResponseBody?: (_reason: unknown) => Promise<void>
  readonly label: string
  readonly release: () => void
}

const defaultDrainTimeoutMilliseconds = 20_000
const defaultForcedPhaseTimeoutMilliseconds = 5_000
const serviceUnavailableResponse = {
  code: "SERVICE_UNAVAILABLE",
  message: "서버가 종료 중입니다.",
} as const

type ResponseMetadata = Pick<Response, "redirected" | "type" | "url">

class MetadataPreservingResponse extends Response {
  readonly #metadata: ResponseMetadata

  constructor(
    body: BodyInit | null,
    init: ResponseInit,
    metadata: ResponseMetadata
  ) {
    super(body, init)
    this.#metadata = metadata
  }

  override get redirected(): boolean {
    return this.#metadata.redirected
  }

  override get type(): ResponseType {
    return this.#metadata.type
  }

  override get url(): string {
    return this.#metadata.url
  }

  override clone(): Response {
    const clonedResponse = super.clone()

    return new MetadataPreservingResponse(
      clonedResponse.body,
      {
        headers: clonedResponse.headers,
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
      },
      this.#metadata
    )
  }
}

const defaultScheduler: ServerLifecycleScheduler = {
  schedule(delayMilliseconds, task) {
    const timeout = setTimeout(task, delayMilliseconds)

    return {
      cancel() {
        clearTimeout(timeout)
      },
    }
  },
}

export function createUnifiedApiServerLifecycle(input: {
  readonly closeDatabase: () => Promise<void> | void
  readonly drainTimeoutMilliseconds?: number
  readonly externalCleanups?: readonly (() => Promise<void> | void)[]
  readonly fetch: (_request: Request) => Promise<Response> | Response
  readonly forcedPhaseTimeoutMilliseconds?: number
  readonly onShutdownError?: (
    _error: unknown,
    _phase: UnifiedApiShutdownPhase
  ) => void
  readonly scheduler?: ServerLifecycleScheduler
}): UnifiedApiServerLifecycle {
  const activeActivities = new Set<ActiveActivity>()
  const drainWaiters = new Set<() => void>()
  const drainTimeoutMilliseconds =
    input.drainTimeoutMilliseconds ?? defaultDrainTimeoutMilliseconds
  const externalCleanups = input.externalCleanups ?? []
  const forcedPhaseTimeoutMilliseconds =
    input.forcedPhaseTimeoutMilliseconds ??
    defaultForcedPhaseTimeoutMilliseconds
  const scheduler = input.scheduler ?? defaultScheduler
  let acceptingRequests = true
  let server: UnifiedApiServer | undefined
  let shutdownPromise: Promise<void> | undefined

  if (
    !Number.isFinite(drainTimeoutMilliseconds) ||
    drainTimeoutMilliseconds < 0
  ) {
    throw new Error("API drain timeout은 0 이상의 유한한 값이어야 합니다.")
  }
  if (
    !Number.isFinite(forcedPhaseTimeoutMilliseconds) ||
    forcedPhaseTimeoutMilliseconds < 0
  ) {
    throw new Error(
      "API forced phase timeout은 0 이상의 유한한 값이어야 합니다."
    )
  }

  function releaseDrainWaiters(): void {
    if (activeActivities.size > 0) return

    for (const finishDrain of drainWaiters) finishDrain()
    drainWaiters.clear()
  }

  function acquireActivity(
    label: string,
    linkedSignal?: AbortSignal
  ): ActiveActivity {
    if (!acceptingRequests) {
      throw new Error(
        "종료 중인 API lifecycle에는 activity를 추가할 수 없습니다."
      )
    }

    const abortController = new AbortController()
    let released = false
    let removeLinkedAbortListener: (() => void) | undefined
    const activity: ActiveActivity = {
      abortController,
      label,
      release() {
        if (released) return

        released = true
        removeLinkedAbortListener?.()
        activeActivities.delete(activity)
        releaseDrainWaiters()
      },
    }

    if (linkedSignal !== undefined) {
      const abortLinkedActivity = () => {
        if (!abortController.signal.aborted) {
          abortController.abort(linkedSignal.reason)
        }
        if (activity.cancelResponseBody !== undefined) {
          void activity
            .cancelResponseBody(linkedSignal.reason)
            .catch((error: unknown) =>
              reportShutdownError(error, "cancel-activity")
            )
        }
      }

      if (linkedSignal.aborted) {
        abortLinkedActivity()
      } else {
        linkedSignal.addEventListener("abort", abortLinkedActivity, {
          once: true,
        })
        removeLinkedAbortListener = () =>
          linkedSignal.removeEventListener("abort", abortLinkedActivity)
      }
    }

    activeActivities.add(activity)
    return activity
  }

  function waitForDrain(): Promise<void> {
    if (activeActivities.size === 0) return Promise.resolve()

    return new Promise((resolve) => drainWaiters.add(resolve))
  }

  function waitForDrainDeadline(): Promise<"drained" | "timed-out"> {
    if (activeActivities.size === 0) return Promise.resolve("drained")

    return new Promise((resolve) => {
      let settled = false
      const timeout = scheduler.schedule(drainTimeoutMilliseconds, () => {
        if (settled) return

        settled = true
        resolve("timed-out")
      })

      void waitForDrain().then(() => {
        if (settled) return

        settled = true
        timeout.cancel()
        resolve("drained")
      })
    })
  }

  function createForcedPhaseDeadline(): {
    readonly cancel: () => void
    readonly expiration: Promise<void>
  } {
    let expired = false
    let expire: (() => void) | undefined
    const expiration = new Promise<void>((resolve) => {
      expire = resolve
    })
    const scheduledTask = scheduler.schedule(
      forcedPhaseTimeoutMilliseconds,
      () => {
        if (expired) return

        expired = true
        expire?.()
      }
    )

    return {
      cancel() {
        if (expired) return

        expired = true
        scheduledTask.cancel()
      },
      expiration,
    }
  }

  function reportShutdownError(
    error: unknown,
    phase: UnifiedApiShutdownPhase
  ): void {
    try {
      input.onShutdownError?.(error, phase)
    } catch {
      // 종료 오류 reporter의 실패가 나머지 resource 정리를 막아서는 안 된다.
    }
  }

  async function waitWithinForcedPhaseDeadline(
    operation: Promise<void>,
    deadline: { readonly expiration: Promise<void> },
    phase: "cancel-activity" | "cleanup-external" | "force-stop-server"
  ): Promise<void> {
    const result = await waitForOperationWithinDeadline(operation, deadline)

    if (result === "timed-out") {
      reportShutdownError(
        new DOMException(
          `API ${phase} phase가 forced shutdown deadline을 초과했습니다.`,
          "TimeoutError"
        ),
        phase
      )
    }
  }

  function waitForOperationWithinDeadline(
    operation: Promise<void>,
    deadline: { readonly expiration: Promise<void> }
  ): Promise<"completed" | "timed-out"> {
    return Promise.race([
      operation.then(() => "completed" as const),
      deadline.expiration.then(() => "timed-out" as const),
    ])
  }

  async function stopServer(
    closeActiveConnections: boolean,
    phase: "force-stop-server" | "stop-server"
  ): Promise<void> {
    try {
      await server?.stop(closeActiveConnections)
    } catch (error) {
      reportShutdownError(error, phase)
    }
  }

  async function abortActiveActivities(): Promise<void> {
    const reason = new DOMException(
      "API graceful shutdown deadline이 지났습니다.",
      "AbortError"
    )
    const cancellations: Promise<void>[] = []

    for (const activity of [...activeActivities]) {
      if (!activity.abortController.signal.aborted) {
        activity.abortController.abort(reason)
      }
      activity.release()

      if (activity.cancelResponseBody !== undefined) {
        cancellations.push(activity.cancelResponseBody(reason))
      }
    }

    const cancellationResults = await Promise.allSettled(cancellations)
    for (const result of cancellationResults) {
      if (result.status === "rejected") {
        reportShutdownError(result.reason, "cancel-activity")
      }
    }
  }

  async function runExternalCleanups(): Promise<void> {
    const cleanupResults = await Promise.allSettled(
      externalCleanups.map((cleanup) => Promise.resolve().then(cleanup))
    )

    for (const result of cleanupResults) {
      if (result.status === "rejected") {
        reportShutdownError(result.reason, "cleanup-external")
      }
    }
  }

  async function closeDatabase(): Promise<void> {
    try {
      await input.closeDatabase()
    } catch (error) {
      reportShutdownError(error, "close-database")
    }
  }

  function trackResponseBody(
    response: Response,
    activity: ActiveActivity
  ): Response {
    if (response.body === null) {
      activity.release()
      return response
    }

    const reader = response.body.getReader()
    let bodyCancellation: Promise<void> | undefined
    const cancelResponseBody = (reason: unknown): Promise<void> => {
      bodyCancellation ??= (async () => {
        if (!activity.abortController.signal.aborted) {
          activity.abortController.abort(reason)
        }

        try {
          await reader.cancel(reason)
        } finally {
          activity.release()
        }
      })()
      return bodyCancellation
    }
    activity.cancelResponseBody = cancelResponseBody

    if (activity.abortController.signal.aborted) {
      void cancelResponseBody(activity.abortController.signal.reason).catch(
        (error: unknown) => reportShutdownError(error, "cancel-activity")
      )
    }

    const trackedBody = new ReadableStream<Uint8Array>({
      async cancel(reason) {
        await cancelResponseBody(reason)
      },
      async pull(controller) {
        try {
          const chunk = await reader.read()
          if (chunk.done) {
            activity.release()
            controller.close()
            return
          }

          controller.enqueue(chunk.value)
        } catch (error) {
          activity.release()
          controller.error(error)
        }
      },
    })

    return new MetadataPreservingResponse(
      trackedBody,
      {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      },
      {
        redirected: response.redirected,
        type: response.type,
        url: response.url,
      }
    )
  }

  return {
    acquireLongLivedLease(label): LongLivedActivityLease {
      const activity = acquireActivity(label)

      return {
        label,
        release: activity.release,
        signal: activity.abortController.signal,
      }
    },
    attachServer(attachedServer): void {
      if (server !== undefined) {
        throw new Error(
          "통합 API server lifecycle에 server가 이미 연결되었습니다."
        )
      }
      if (!acceptingRequests) {
        throw new Error(
          "종료가 시작된 API lifecycle에는 server를 연결할 수 없습니다."
        )
      }

      server = attachedServer
    },
    async fetch(request): Promise<Response> {
      if (!acceptingRequests) {
        return Response.json(serviceUnavailableResponse, { status: 503 })
      }

      const activity = acquireActivity("request", request.signal)
      try {
        const linkedRequest = new Request(request, {
          signal: activity.abortController.signal,
        })
        const response = await input.fetch(linkedRequest)
        return trackResponseBody(response, activity)
      } catch (error) {
        activity.release()
        throw error
      }
    },
    shutdown(): Promise<void> {
      shutdownPromise ??= (async () => {
        acceptingRequests = false
        const gracefulStop = stopServer(false, "stop-server")
        const drainResult = await waitForDrainDeadline()
        const forcedPhaseDeadline = createForcedPhaseDeadline()

        if (drainResult === "timed-out") {
          const forceStop = stopServer(true, "force-stop-server")
          const stoppedServers = Promise.all([gracefulStop, forceStop]).then(
            () => undefined
          )
          await waitWithinForcedPhaseDeadline(
            abortActiveActivities(),
            forcedPhaseDeadline,
            "cancel-activity"
          )
          await waitWithinForcedPhaseDeadline(
            stoppedServers,
            forcedPhaseDeadline,
            "force-stop-server"
          )
        } else if (
          (await waitForOperationWithinDeadline(
            gracefulStop,
            forcedPhaseDeadline
          )) === "timed-out"
        ) {
          const forceStop = stopServer(true, "force-stop-server")
          await waitWithinForcedPhaseDeadline(
            Promise.all([gracefulStop, forceStop]).then(() => undefined),
            forcedPhaseDeadline,
            "force-stop-server"
          )
        }

        if (externalCleanups.length > 0) {
          await waitWithinForcedPhaseDeadline(
            runExternalCleanups(),
            forcedPhaseDeadline,
            "cleanup-external"
          )
        }
        forcedPhaseDeadline.cancel()
        await closeDatabase()
      })()

      return shutdownPromise
    },
  }
}

export function createLearnerApiServerLifecycle(input: {
  readonly closeCore: () => Promise<void> | void
  readonly drainTimeoutMilliseconds?: number
  readonly fetch: (_request: Request) => Promise<Response> | Response
  readonly forcedPhaseTimeoutMilliseconds?: number
  readonly onShutdownError: (
    _error: unknown,
    _phase: LearnerApiShutdownPhase
  ) => void
  readonly scheduler?: ServerLifecycleScheduler
}): UnifiedApiServerLifecycle {
  return createUnifiedApiServerLifecycle({
    closeDatabase: input.closeCore,
    drainTimeoutMilliseconds: input.drainTimeoutMilliseconds,
    fetch: input.fetch,
    forcedPhaseTimeoutMilliseconds: input.forcedPhaseTimeoutMilliseconds,
    onShutdownError(error, phase) {
      input.onShutdownError(
        error,
        phase === "close-database" ? "close-core" : "stop-server"
      )
    },
    scheduler: input.scheduler,
  })
}

export function registerUnifiedApiShutdownSignals(
  shutdown: () => Promise<void>,
  register: (_signal: "SIGINT" | "SIGTERM", _listener: () => void) => void = (
    signal,
    listener
  ) => process.once(signal, listener),
  onShutdownError: (_error: unknown) => void = (error) => {
    process.stderr.write(`API 종료 중 처리되지 않은 오류: ${String(error)}\n`)
  }
): void {
  let shutdownStarted = false
  const listener = () => {
    if (shutdownStarted) return

    shutdownStarted = true
    void shutdown().catch((error: unknown) => {
      try {
        onShutdownError(error)
      } catch {
        // signal handler의 보고 실패를 unhandled rejection으로 확대하지 않는다.
      }
    })
  }

  register("SIGINT", listener)
  register("SIGTERM", listener)
}

export function registerLearnerApiShutdownSignals(
  shutdown: () => Promise<void>,
  register?: (_signal: "SIGINT" | "SIGTERM", _listener: () => void) => void,
  onShutdownError?: (_error: unknown) => void
): void {
  registerUnifiedApiShutdownSignals(shutdown, register, onShutdownError)
}
