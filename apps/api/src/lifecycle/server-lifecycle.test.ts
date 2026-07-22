import { describe, expect, it, vi } from "vitest"

import {
  createUnifiedApiServerLifecycle,
  registerUnifiedApiShutdownSignals,
  type ServerLifecycleScheduler,
} from "@/lifecycle/server-lifecycle"

describe("통합 API server lifecycle", () => {
  it("drain 결과를 기록하고 event, AI, DB, logger 순서로 resource를 정리한다", async () => {
    const events: string[] = []
    const lifecycle = createUnifiedApiServerLifecycle({
      closeAi() {
        events.push("ai")
      },
      closeDatabase() {
        events.push("database")
      },
      fetch: () => new Response(null),
      flushLogger() {
        events.push("logger")
      },
      onDrainResult(observation) {
        events.push(
          `drain:${observation.result}:${observation.activeActivities}:${observation.timeoutMilliseconds}`
        )
      },
      unsubscribeEvents() {
        events.push("events")
      },
    })
    lifecycle.attachServer({
      stop(force) {
        events.push(`stop:${String(force)}`)
      },
    })

    await lifecycle.shutdown()

    expect(events).toEqual([
      "stop:false",
      "drain:drained:0:20000",
      "events",
      "ai",
      "database",
      "logger",
    ])
  })

  it("각 cleanup 실패를 구조화 phase로 격리하고 logger flush까지 계속한다", async () => {
    const failures = {
      ai: new Error("ai close failed"),
      database: new Error("database close failed"),
      events: new Error("event unsubscribe failed"),
      logger: new Error("logger flush failed"),
    }
    const onShutdownError = vi.fn()
    const lifecycle = createUnifiedApiServerLifecycle({
      closeAi() {
        throw failures.ai
      },
      closeDatabase() {
        throw failures.database
      },
      fetch: () => new Response(null),
      flushLogger() {
        throw failures.logger
      },
      onShutdownError,
      unsubscribeEvents() {
        throw failures.events
      },
    })
    lifecycle.attachServer({ stop: vi.fn() })

    await expect(lifecycle.shutdown()).resolves.toBeUndefined()
    expect(onShutdownError.mock.calls).toEqual([
      [failures.events, "unsubscribe-events"],
      [failures.ai, "close-ai"],
      [failures.database, "close-database"],
      [failures.logger, "flush-logger"],
    ])
  })

  it("learner와 admin 응답 body가 모두 소비될 때까지 자연 drain하고 새 요청은 503으로 거절한다", async () => {
    const learnerStream = createControlledStream()
    const adminStream = createControlledStream()
    const scheduler = createFakeScheduler()
    const closeDatabase = vi.fn()
    const stop = vi.fn()
    const lifecycle = createUnifiedApiServerLifecycle({
      closeDatabase,
      fetch(request) {
        return new URL(request.url).hostname === "learner.example.com"
          ? learnerStream.response
          : adminStream.response
      },
      scheduler: scheduler.value,
    })
    lifecycle.attachServer({ stop })

    const learnerResponse = await lifecycle.fetch(
      new Request("https://learner.example.com/shared")
    )
    const adminResponse = await lifecycle.fetch(
      new Request("https://admin.example.com/shared")
    )
    const learnerBody = learnerResponse.text()
    const adminBody = adminResponse.text()
    const shutdown = lifecycle.shutdown()
    const rejected = await lifecycle.fetch(
      new Request("https://learner.example.com/rejected")
    )

    expect(stop).toHaveBeenCalledWith(false)
    expect(scheduler.delays).toEqual([20_000])
    expect(closeDatabase).not.toHaveBeenCalled()
    expect(rejected.status).toBe(503)
    await expect(rejected.json()).resolves.toEqual({
      code: "SERVICE_UNAVAILABLE",
      message: "서버가 종료 중입니다.",
    })

    learnerStream.enqueue("learner")
    learnerStream.close()
    await expect(learnerBody).resolves.toBe("learner")
    expect(closeDatabase).not.toHaveBeenCalled()

    adminStream.enqueue("admin")
    adminStream.close()
    await expect(adminBody).resolves.toBe("admin")
    await shutdown

    expect(scheduler.tasks[0]?.cancelled).toBe(true)
    expect(stop).toHaveBeenCalledTimes(1)
    expect(closeDatabase).toHaveBeenCalledTimes(1)
  })

  it("소비자가 response body를 취소하면 원본 stream과 linked request signal에 전파한다", async () => {
    const stream = createControlledStream()
    const scheduler = createFakeScheduler()
    let linkedSignal: AbortSignal | undefined
    const lifecycle = createUnifiedApiServerLifecycle({
      closeDatabase: vi.fn(),
      fetch(request) {
        linkedSignal = request.signal
        return stream.response
      },
      scheduler: scheduler.value,
    })
    lifecycle.attachServer({ stop: vi.fn() })

    const response = await lifecycle.fetch(new Request("https://api.test"))
    const shutdown = lifecycle.shutdown()
    await response.body?.cancel("consumer-cancelled")
    await shutdown

    expect(linkedSignal?.aborted).toBe(true)
    expect(stream.cancelReasons).toEqual(["consumer-cancelled"])
    expect(scheduler.tasks[0]?.cancelled).toBe(true)
  })

  it("원본 request abort를 linked signal과 response body cancel에 전파한다", async () => {
    const requestController = new AbortController()
    const stream = createControlledStream()
    const scheduler = createFakeScheduler()
    let linkedSignal: AbortSignal | undefined
    const lifecycle = createUnifiedApiServerLifecycle({
      closeDatabase: vi.fn(),
      fetch(request) {
        linkedSignal = request.signal
        return stream.response
      },
      scheduler: scheduler.value,
    })
    lifecycle.attachServer({ stop: vi.fn() })

    await lifecycle.fetch(
      new Request("https://api.test", { signal: requestController.signal })
    )
    const shutdown = lifecycle.shutdown()
    requestController.abort("client-disconnected")
    await shutdown

    expect(linkedSignal?.aborted).toBe(true)
    expect(linkedSignal?.reason).toBe("client-disconnected")
    expect(stream.cancelReasons).toEqual(["client-disconnected"])
    expect(scheduler.tasks[0]?.cancelled).toBe(true)
  })

  it("response body error도 activity를 해제해 shutdown을 막지 않는다", async () => {
    const stream = createControlledStream()
    const scheduler = createFakeScheduler()
    const closeDatabase = vi.fn()
    const lifecycle = createUnifiedApiServerLifecycle({
      closeDatabase,
      fetch: () => stream.response,
      scheduler: scheduler.value,
    })
    lifecycle.attachServer({ stop: vi.fn() })

    const response = await lifecycle.fetch(new Request("https://api.test"))
    const body = response.text()
    const shutdown = lifecycle.shutdown()
    stream.error(new Error("stream failed"))

    await expect(body).rejects.toThrow("stream failed")
    await shutdown
    expect(closeDatabase).toHaveBeenCalledTimes(1)
    expect(scheduler.tasks[0]?.cancelled).toBe(true)
  })

  it("tracked response가 redirect metadata와 clone metadata를 보존한다", async () => {
    const redirectResponse = createRedirectResponseFixture()
    const lifecycle = createUnifiedApiServerLifecycle({
      closeDatabase: vi.fn(),
      fetch: () => redirectResponse,
    })

    const response = await lifecycle.fetch(new Request("https://api.test"))
    const clonedResponse = response.clone()

    for (const candidate of [response, clonedResponse]) {
      expect(candidate.headers.get("x-response-source")).toBe("redirect")
      expect(candidate.redirected).toBe(true)
      expect(candidate.status).toBe(202)
      expect(candidate.statusText).toBe("Accepted")
      expect(candidate.type).toBe("cors")
      expect(candidate.url).toBe("https://provider.test/final")
    }
    await expect(response.text()).resolves.toBe("redirected response")
    await expect(clonedResponse.text()).resolves.toBe("redirected response")
    await lifecycle.shutdown()
  })

  it("drain deadline이면 stop(true), request abort와 body cancel 뒤 cleanup과 DB close를 수행한다", async () => {
    const events: string[] = []
    const stream = createControlledStream(() => {
      events.push("body-cancel")
    })
    const scheduler = createFakeScheduler()
    let linkedSignal: AbortSignal | undefined
    const lifecycle = createUnifiedApiServerLifecycle({
      closeDatabase() {
        events.push("database")
      },
      drainTimeoutMilliseconds: 125,
      unsubscribeEvents() {
        events.push("cleanup")
      },
      fetch(request) {
        linkedSignal = request.signal
        return stream.response
      },
      scheduler: scheduler.value,
    })
    lifecycle.attachServer({
      stop(force) {
        events.push(`stop:${String(force)}`)
      },
    })

    await lifecycle.fetch(new Request("https://learner.example.com/stream"))
    const lease = lifecycle.acquireLongLivedLease("admin-ai-chat-sse")
    const shutdown = lifecycle.shutdown()

    expect(scheduler.delays).toEqual([125])
    scheduler.runNext()
    await shutdown

    expect(events).toEqual([
      "stop:false",
      "stop:true",
      "body-cancel",
      "cleanup",
      "database",
    ])
    expect(linkedSignal?.aborted).toBe(true)
    expect(lease.signal.aborted).toBe(true)
    expect(stream.cancelReasons).toHaveLength(1)
    expect(stream.cancelReasons[0]).toBe(linkedSignal?.reason)
    expect(linkedSignal?.reason).toMatchObject({ name: "AbortError" })
    expect(scheduler.delays).toEqual([125, 5_000])
    expect(scheduler.tasks[1]?.cancelled).toBe(true)
    lease.release()
    lease.release()
  })

  it("force stop 후 graceful stop과 force stop이 모두 종료될 때까지 DB를 닫지 않는다", async () => {
    const events: string[] = []
    const stream = createControlledStream(() => {
      events.push("body-cancel")
    })
    const scheduler = createFakeScheduler()
    const gracefulStop = createDeferred<void>()
    const forceStopStarted = createDeferred<void>()
    const lifecycle = createUnifiedApiServerLifecycle({
      closeDatabase() {
        events.push("database")
      },
      drainTimeoutMilliseconds: 125,
      fetch: () => stream.response,
      scheduler: scheduler.value,
    })
    lifecycle.attachServer({
      stop(force) {
        events.push(`stop:${String(force)}`)
        if (force) {
          forceStopStarted.resolve()
          return
        }

        return gracefulStop.promise
      },
    })

    await lifecycle.fetch(new Request("https://api.test/stream"))
    const shutdown = lifecycle.shutdown()
    scheduler.runNext()
    await forceStopStarted.promise
    await waitForMicrotasks()

    expect(events).toEqual(["stop:false", "stop:true", "body-cancel"])
    gracefulStop.resolve()
    await shutdown

    expect(events).toEqual([
      "stop:false",
      "stop:true",
      "body-cancel",
      "database",
    ])
    expect(scheduler.delays).toEqual([125, 5_000])
    expect(scheduler.tasks[1]?.cancelled).toBe(true)
  })

  it("graceful stop이 force stop 후에도 종료되지 않으면 공유 deadline 뒤 DB를 닫는다", async () => {
    const scheduler = createFakeScheduler()
    const neverSettles = new Promise<void>(() => undefined)
    const forceStopStarted = createDeferred<void>()
    const activityAborted = createDeferred<void>()
    const onShutdownError = vi.fn()
    const closeDatabase = vi.fn()
    const lifecycle = createUnifiedApiServerLifecycle({
      closeDatabase,
      drainTimeoutMilliseconds: 125,
      fetch: () => new Response(null),
      forcedPhaseTimeoutMilliseconds: 50,
      onShutdownError,
      scheduler: scheduler.value,
    })
    lifecycle.attachServer({
      stop(force) {
        if (force) forceStopStarted.resolve()
        return neverSettles
      },
    })
    const lease = lifecycle.acquireLongLivedLease("never-settling-stop")
    lease.signal.addEventListener("abort", () => activityAborted.resolve(), {
      once: true,
    })

    const shutdown = lifecycle.shutdown()
    scheduler.runNext()
    await forceStopStarted.promise
    await activityAborted.promise
    await waitForMicrotasks()
    await waitForMicrotasks()

    expect(scheduler.delays).toEqual([125, 50])
    scheduler.runNext()
    await shutdown

    expect(closeDatabase).toHaveBeenCalledOnce()
    expect(onShutdownError).toHaveBeenCalledOnce()
    expect(onShutdownError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "TimeoutError" }),
      "force-stop-server"
    )
  })

  it("active activity가 없어도 graceful stop이 종료되지 않으면 force stop 후 DB를 닫는다", async () => {
    const scheduler = createFakeScheduler()
    const neverSettles = new Promise<void>(() => undefined)
    const forceStopStarted = createDeferred<void>()
    const onShutdownError = vi.fn()
    const closeDatabase = vi.fn()
    const stop = vi.fn((force?: boolean) => {
      if (force) {
        forceStopStarted.resolve()
        return
      }

      return neverSettles
    })
    const lifecycle = createUnifiedApiServerLifecycle({
      closeDatabase,
      fetch: () => new Response(null),
      forcedPhaseTimeoutMilliseconds: 50,
      onShutdownError,
      scheduler: scheduler.value,
    })
    lifecycle.attachServer({ stop })

    const shutdown = lifecycle.shutdown()
    await waitForMicrotasks()

    expect(stop).toHaveBeenCalledTimes(1)
    expect(stop).toHaveBeenNthCalledWith(1, false)
    expect(scheduler.delays).toEqual([50])
    scheduler.runNext()
    await forceStopStarted.promise
    await shutdown

    expect(stop).toHaveBeenCalledTimes(2)
    expect(stop).toHaveBeenNthCalledWith(2, true)
    expect(closeDatabase).toHaveBeenCalledOnce()
    expect(onShutdownError).toHaveBeenCalledOnce()
    expect(onShutdownError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "TimeoutError" }),
      "force-stop-server"
    )
  })

  it("취소와 external cleanup이 종료되지 않아도 공유 forced deadline 뒤 DB를 닫는다", async () => {
    const events: string[] = []
    const cancellationStarted = createDeferred<void>()
    const neverSettles = new Promise<void>(() => undefined)
    const stream = createControlledStream(() => {
      events.push("body-cancel")
      cancellationStarted.resolve()
      return neverSettles
    })
    const scheduler = createFakeScheduler()
    const onShutdownError = vi.fn()
    const closeDatabase = vi.fn(() => {
      events.push("database")
    })
    const lifecycle = createUnifiedApiServerLifecycle({
      closeDatabase,
      drainTimeoutMilliseconds: 125,
      unsubscribeEvents() {
        events.push("cleanup")
        return neverSettles
      },
      fetch: () => stream.response,
      forcedPhaseTimeoutMilliseconds: 50,
      onShutdownError,
      scheduler: scheduler.value,
    })
    lifecycle.attachServer({ stop: vi.fn() })

    await lifecycle.fetch(new Request("https://api.test/stream"))
    const shutdown = lifecycle.shutdown()
    scheduler.runNext()
    await cancellationStarted.promise

    expect(scheduler.delays).toEqual([125, 50])
    scheduler.runNext()
    await shutdown

    expect(events).toEqual(["body-cancel", "cleanup", "database"])
    expect(closeDatabase).toHaveBeenCalledTimes(1)
    expect(scheduler.tasks).toHaveLength(2)
    expect(
      onShutdownError.mock.calls.map(([error, phase]) => ({
        name: (error as DOMException).name,
        phase,
      }))
    ).toEqual([
      { name: "TimeoutError", phase: "cancel-activity" },
      { name: "TimeoutError", phase: "unsubscribe-events" },
    ])
  })

  it("명시적 long-lived lease release는 멱등이며 자연 drain에 포함된다", async () => {
    const scheduler = createFakeScheduler()
    const closeDatabase = vi.fn()
    const lifecycle = createUnifiedApiServerLifecycle({
      closeDatabase,
      fetch: () => new Response(null),
      scheduler: scheduler.value,
    })
    lifecycle.attachServer({ stop: vi.fn() })
    const lease = lifecycle.acquireLongLivedLease("learner-progress-sse")

    const shutdown = lifecycle.shutdown()
    expect(closeDatabase).not.toHaveBeenCalled()
    lease.release()
    lease.release()
    await shutdown

    expect(lease.label).toBe("learner-progress-sse")
    expect(lease.signal.aborted).toBe(false)
    expect(closeDatabase).toHaveBeenCalledTimes(1)
    expect(scheduler.tasks[0]?.cancelled).toBe(true)
  })

  it("event와 AI cleanup을 순서대로 격리하고 모두 끝난 뒤 DB를 한 번만 닫는다", async () => {
    const firstCleanup = createDeferred<void>()
    const events: string[] = []
    const cleanupError = new Error("provider cleanup failed")
    const onShutdownError = vi.fn()
    const lifecycle = createUnifiedApiServerLifecycle({
      closeDatabase() {
        events.push("database")
      },
      async unsubscribeEvents() {
        events.push("cleanup:first")
        await firstCleanup.promise
        events.push("cleanup:first:done")
      },
      closeAi() {
        events.push("cleanup:second")
        throw cleanupError
      },
      fetch: () => new Response(null),
      onShutdownError,
    })
    lifecycle.attachServer({
      stop(force) {
        events.push(`stop:${String(force)}`)
      },
    })

    const firstShutdown = lifecycle.shutdown()
    const repeatedShutdown = lifecycle.shutdown()
    await waitForMicrotasks()

    expect(firstShutdown).toBe(repeatedShutdown)
    expect(events).toEqual(["stop:false", "cleanup:first"])

    firstCleanup.resolve()
    await firstShutdown
    await lifecycle.shutdown()

    expect(events).toEqual([
      "stop:false",
      "cleanup:first",
      "cleanup:first:done",
      "cleanup:second",
      "database",
    ])
    expect(onShutdownError).toHaveBeenCalledWith(cleanupError, "close-ai")
  })
})

describe("API shutdown signal 등록", () => {
  it("SIGINT와 SIGTERM 중 최초 신호만 실행한다", async () => {
    const listeners = new Map<string, () => void>()
    const shutdown = vi.fn(async () => undefined)
    registerUnifiedApiShutdownSignals(shutdown, (signal, listener) => {
      listeners.set(signal, listener)
    })

    listeners.get("SIGINT")?.()
    listeners.get("SIGTERM")?.()
    await waitForMicrotasks()

    expect(shutdown).toHaveBeenCalledTimes(1)
  })

  it("shutdown rejection을 catch hook으로 보고한다", async () => {
    const listeners = new Map<string, () => void>()
    const shutdownError = new Error("shutdown failed")
    const onShutdownError = vi.fn()
    registerUnifiedApiShutdownSignals(
      async () => {
        throw shutdownError
      },
      (signal, listener) => {
        listeners.set(signal, listener)
      },
      onShutdownError
    )

    listeners.get("SIGTERM")?.()
    await waitForMicrotasks()

    expect(onShutdownError).toHaveBeenCalledOnce()
    expect(onShutdownError).toHaveBeenCalledWith(shutdownError)
  })
})

function createRedirectResponseFixture(): Response {
  const response = new Response("redirected response", {
    headers: { "x-response-source": "redirect" },
    status: 202,
    statusText: "Accepted",
  })

  Object.defineProperties(response, {
    redirected: { value: true },
    type: { value: "cors" },
    url: { value: "https://provider.test/final" },
  })
  return response
}

function createControlledStream(onCancel?: () => Promise<void> | void): {
  readonly cancelReasons: unknown[]
  readonly close: () => void
  readonly enqueue: (_value: string) => void
  readonly error: (_error: unknown) => void
  readonly response: Response
} {
  const cancelReasons: unknown[] = []
  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined
  const body = new ReadableStream<Uint8Array>({
    cancel(reason) {
      cancelReasons.push(reason)
      return onCancel?.()
    },
    start(startedController) {
      controller = startedController
    },
  })

  function readController(): ReadableStreamDefaultController<Uint8Array> {
    if (controller === undefined) {
      throw new Error("controlled stream controller가 준비되지 않았습니다.")
    }
    return controller
  }

  return {
    cancelReasons,
    close: () => readController().close(),
    enqueue: (value) => readController().enqueue(encoder.encode(value)),
    error: (error) => readController().error(error),
    response: new Response(body),
  }
}

function createDeferred<T>(): {
  readonly promise: Promise<T>
  readonly reject: (_reason?: unknown) => void
  readonly resolve: (_value: T | PromiseLike<T>) => void
} {
  let reject: ((reason?: unknown) => void) | undefined
  let resolve: ((value: T | PromiseLike<T>) => void) | undefined
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    reject = rejectPromise
    resolve = resolvePromise
  })

  return {
    promise,
    reject(reason) {
      reject?.(reason)
    },
    resolve(value) {
      resolve?.(value)
    },
  }
}

function createFakeScheduler(): {
  readonly delays: readonly number[]
  readonly runNext: () => void
  readonly tasks: readonly {
    cancelled: boolean
    readonly delayMilliseconds: number
    ran: boolean
    readonly run: () => void
  }[]
  readonly value: ServerLifecycleScheduler
} {
  const tasks: {
    cancelled: boolean
    readonly delayMilliseconds: number
    ran: boolean
    readonly run: () => void
  }[] = []
  const scheduler: ServerLifecycleScheduler = {
    schedule(delayMilliseconds, task) {
      const scheduledTask = {
        cancelled: false,
        delayMilliseconds,
        ran: false,
        run: task,
      }
      tasks.push(scheduledTask)

      return {
        cancel() {
          scheduledTask.cancelled = true
        },
      }
    },
  }

  return {
    get delays() {
      return tasks.map((task) => task.delayMilliseconds)
    },
    runNext() {
      const task = tasks.find(
        (candidate) => !candidate.cancelled && !candidate.ran
      )
      if (task === undefined) {
        throw new Error("실행할 lifecycle scheduler task가 없습니다.")
      }

      task.ran = true
      task.run()
    },
    tasks,
    value: scheduler,
  }
}

async function waitForMicrotasks(): Promise<void> {
  for (let turn = 0; turn < 6; turn += 1) await Promise.resolve()
}
