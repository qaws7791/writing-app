import { describe, expect, it, vi } from "vitest"

import { createUnifiedApiServerLifecycle } from "@/lifecycle/server-lifecycle"
import {
  createControlledStream,
  createDeferred,
  createFakeScheduler,
} from "@/test-support/server-lifecycle-fixture"

const drainTimeoutMilliseconds = 125

describe("통합 API server lifecycle", () => {
  it("drain 결과를 기록하고 container에 resource 정리를 위임한다", async () => {
    const events: string[] = []
    const lifecycle = createUnifiedApiServerLifecycle({
      disposeContainer() {
        events.push("container")
      },
      drainTimeoutMilliseconds,
      fetch: () => new Response(null),
      onDrainResult(observation) {
        events.push(
          `drain:${observation.result}:${observation.activeActivities}:${observation.timeoutMilliseconds}`
        )
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
      `drain:drained:0:${drainTimeoutMilliseconds}`,
      "container",
    ])
  })

  it("container cleanup 실패를 구조화 phase로 격리한다", async () => {
    const failure = new Error("container dispose failed")
    const onShutdownError = vi.fn()
    const lifecycle = createUnifiedApiServerLifecycle({
      disposeContainer() {
        throw failure
      },
      fetch: () => new Response(null),
      onShutdownError,
    })
    lifecycle.attachServer({ stop: vi.fn() })

    await expect(lifecycle.shutdown()).resolves.toBeUndefined()
    expect(onShutdownError).toHaveBeenCalledWith(failure, "dispose-container")
  })

  it("learner와 admin 응답 body가 모두 소비될 때까지 자연 drain하고 새 요청은 503으로 거절한다", async () => {
    const learnerStream = createControlledStream()
    const adminStream = createControlledStream()
    const scheduler = createFakeScheduler()
    const disposeContainer = vi.fn()
    const stop = vi.fn()
    const lifecycle = createUnifiedApiServerLifecycle({
      disposeContainer,
      drainTimeoutMilliseconds,
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
    expect(scheduler.delays).toEqual([drainTimeoutMilliseconds])
    expect(disposeContainer).not.toHaveBeenCalled()
    expect(rejected.status).toBe(503)
    await expect(rejected.json()).resolves.toEqual({
      code: "SERVICE_UNAVAILABLE",
      message: "서버가 종료 중입니다.",
    })

    learnerStream.enqueue("learner")
    learnerStream.close()
    await expect(learnerBody).resolves.toBe("learner")
    expect(disposeContainer).not.toHaveBeenCalled()

    adminStream.enqueue("admin")
    adminStream.close()
    await expect(adminBody).resolves.toBe("admin")
    await shutdown

    expect(scheduler.tasks[0]?.cancelled).toBe(true)
    expect(stop).toHaveBeenCalledTimes(1)
    expect(disposeContainer).toHaveBeenCalledTimes(1)
  })

  it("소비자가 response body를 취소하면 원본 stream과 linked request signal에 전파한다", async () => {
    const stream = createControlledStream()
    const scheduler = createFakeScheduler()
    let linkedSignal: AbortSignal | undefined
    const lifecycle = createUnifiedApiServerLifecycle({
      disposeContainer: vi.fn(),
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
      disposeContainer: vi.fn(),
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
    const disposeContainer = vi.fn()
    const lifecycle = createUnifiedApiServerLifecycle({
      disposeContainer,
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
    expect(disposeContainer).toHaveBeenCalledTimes(1)
    expect(scheduler.tasks[0]?.cancelled).toBe(true)
  })

  it("tracked response가 redirect metadata와 clone metadata를 보존한다", async () => {
    const redirectResponse = createRedirectResponseFixture()
    const lifecycle = createUnifiedApiServerLifecycle({
      disposeContainer: vi.fn(),
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

  it("drain deadline이면 stop(true), request abort와 body cancel 뒤 container를 정리한다", async () => {
    const events: string[] = []
    const stream = createControlledStream(() => {
      events.push("body-cancel")
    })
    const scheduler = createFakeScheduler()
    let linkedSignal: AbortSignal | undefined
    const lifecycle = createUnifiedApiServerLifecycle({
      drainTimeoutMilliseconds,
      disposeContainer() {
        events.push("container")
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
    const lease = lifecycle.acquireLongLivedLease("long-lived-stream")
    const shutdown = lifecycle.shutdown()

    expect(scheduler.delays).toEqual([drainTimeoutMilliseconds])
    scheduler.runNext()
    await shutdown

    expect(events).toEqual([
      "stop:false",
      "stop:true",
      "body-cancel",
      "container",
    ])
    expect(linkedSignal?.aborted).toBe(true)
    expect(lease.signal.aborted).toBe(true)
    expect(stream.cancelReasons).toHaveLength(1)
    expect(stream.cancelReasons[0]).toBe(linkedSignal?.reason)
    expect(linkedSignal?.reason).toMatchObject({ name: "AbortError" })
    expect(scheduler.delays).toEqual([drainTimeoutMilliseconds, 5_000])
    expect(scheduler.tasks[1]?.cancelled).toBe(true)
    lease.release()
    lease.release()
  })

  it("force stop 후 두 server stop이 모두 종료될 때까지 container를 정리하지 않는다", async () => {
    const events: string[] = []
    const bodyCancelled = createDeferred<void>()
    const stream = createControlledStream(() => {
      events.push("body-cancel")
      bodyCancelled.resolve()
    })
    const scheduler = createFakeScheduler()
    const gracefulStop = createDeferred<void>()
    const forceStopStarted = createDeferred<void>()
    const lifecycle = createUnifiedApiServerLifecycle({
      disposeContainer() {
        events.push("container")
      },
      drainTimeoutMilliseconds,
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
    await bodyCancelled.promise

    expect(events).toEqual(["stop:false", "stop:true", "body-cancel"])
    gracefulStop.resolve()
    await shutdown

    expect(events).toEqual([
      "stop:false",
      "stop:true",
      "body-cancel",
      "container",
    ])
    expect(scheduler.delays).toEqual([drainTimeoutMilliseconds, 5_000])
    expect(scheduler.tasks[1]?.cancelled).toBe(true)
  })

  it("graceful stop이 force stop 후에도 종료되지 않으면 공유 deadline 뒤 container를 정리한다", async () => {
    const scheduler = createFakeScheduler()
    const neverSettles = new Promise<void>(() => undefined)
    const forceStopStarted = createDeferred<void>()
    const activityAborted = createDeferred<void>()
    const onShutdownError = vi.fn()
    const disposeContainer = vi.fn()
    const lifecycle = createUnifiedApiServerLifecycle({
      disposeContainer,
      drainTimeoutMilliseconds,
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
    await scheduler.waitForScheduledTaskCount(2)

    expect(scheduler.delays).toEqual([drainTimeoutMilliseconds, 50])
    scheduler.runNext()
    await shutdown

    expect(disposeContainer).toHaveBeenCalledOnce()
    expect(onShutdownError.mock.calls.map(([, phase]) => phase)).toEqual([
      "force-stop-server",
      "dispose-container",
    ])
  })

  it("active activity가 없어도 graceful stop이 종료되지 않으면 force stop 후 container를 정리한다", async () => {
    const scheduler = createFakeScheduler()
    const neverSettles = new Promise<void>(() => undefined)
    const forceStopStarted = createDeferred<void>()
    const onShutdownError = vi.fn()
    const disposeContainer = vi.fn()
    const stop = vi.fn((force?: boolean) => {
      if (force) {
        forceStopStarted.resolve()
        return
      }

      return neverSettles
    })
    const lifecycle = createUnifiedApiServerLifecycle({
      disposeContainer,
      fetch: () => new Response(null),
      forcedPhaseTimeoutMilliseconds: 50,
      onShutdownError,
      scheduler: scheduler.value,
    })
    lifecycle.attachServer({ stop })

    const shutdown = lifecycle.shutdown()
    await scheduler.waitForScheduledTaskCount(1)

    expect(stop).toHaveBeenCalledTimes(1)
    expect(stop).toHaveBeenNthCalledWith(1, false)
    expect(scheduler.delays).toEqual([50])
    scheduler.runNext()
    await forceStopStarted.promise
    await shutdown

    expect(stop).toHaveBeenCalledTimes(2)
    expect(stop).toHaveBeenNthCalledWith(2, true)
    expect(disposeContainer).toHaveBeenCalledOnce()
    expect(onShutdownError.mock.calls.map(([, phase]) => phase)).toEqual([
      "force-stop-server",
      "dispose-container",
    ])
  })

  it("취소와 container cleanup이 종료되지 않아도 공유 forced deadline에 종료한다", async () => {
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
    const lifecycle = createUnifiedApiServerLifecycle({
      drainTimeoutMilliseconds,
      disposeContainer() {
        events.push("container")
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

    expect(scheduler.delays).toEqual([drainTimeoutMilliseconds, 50])
    scheduler.runNext()
    await shutdown

    expect(events).toEqual(["body-cancel", "container"])
    expect(scheduler.tasks).toHaveLength(2)
    expect(
      onShutdownError.mock.calls.map(([error, phase]) => ({
        name: (error as DOMException).name,
        phase,
      }))
    ).toEqual([
      { name: "TimeoutError", phase: "cancel-activity" },
      { name: "TimeoutError", phase: "dispose-container" },
    ])
  })

  it("명시적 long-lived lease release는 멱등이며 자연 drain에 포함된다", async () => {
    const scheduler = createFakeScheduler()
    const disposeContainer = vi.fn()
    const lifecycle = createUnifiedApiServerLifecycle({
      disposeContainer,
      fetch: () => new Response(null),
      scheduler: scheduler.value,
    })
    lifecycle.attachServer({ stop: vi.fn() })
    const lease = lifecycle.acquireLongLivedLease("learner-progress-sse")

    const shutdown = lifecycle.shutdown()
    expect(disposeContainer).not.toHaveBeenCalled()
    lease.release()
    lease.release()
    await shutdown

    expect(lease.label).toBe("learner-progress-sse")
    expect(lease.signal.aborted).toBe(false)
    expect(disposeContainer).toHaveBeenCalledTimes(1)
    expect(scheduler.tasks[0]?.cancelled).toBe(true)
  })

  it("반복 shutdown에서도 container dispose를 한 번만 호출한다", async () => {
    const disposal = createDeferred<void>()
    const disposalStarted = createDeferred<void>()
    const events: string[] = []
    const lifecycle = createUnifiedApiServerLifecycle({
      async disposeContainer() {
        events.push("container")
        disposalStarted.resolve()
        await disposal.promise
        events.push("container:done")
      },
      fetch: () => new Response(null),
    })
    lifecycle.attachServer({
      stop(force) {
        events.push(`stop:${String(force)}`)
      },
    })

    const firstShutdown = lifecycle.shutdown()
    const repeatedShutdown = lifecycle.shutdown()
    await disposalStarted.promise

    expect(firstShutdown).toBe(repeatedShutdown)
    expect(events).toEqual(["stop:false", "container"])

    disposal.resolve()
    await firstShutdown
    await lifecycle.shutdown()

    expect(events).toEqual(["stop:false", "container", "container:done"])
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
