import { describe, expect, it, vi } from "vitest"

import {
  createLearnerApiServerLifecycle,
  registerLearnerApiShutdownSignals,
} from "@/server-lifecycle"

describe("학습자 API server lifecycle", () => {
  it("진행 요청을 drain하고 종료 중 새 요청을 503으로 거부한 뒤 core를 한 번 닫는다", async () => {
    let finishRequest: ((_response: Response) => void) | undefined
    const closeCore = vi.fn()
    const stop = vi.fn()
    const lifecycle = createLearnerApiServerLifecycle({
      closeCore,
      fetch: () =>
        new Promise<Response>((resolve) => {
          finishRequest = resolve
        }),
      onShutdownError: vi.fn(),
    })
    lifecycle.attachServer({ stop })

    const inFlight = lifecycle.fetch(new Request("http://localhost/slow"))
    const shutdown = lifecycle.shutdown()
    const rejected = await lifecycle.fetch(
      new Request("http://localhost/rejected")
    )

    expect(rejected.status).toBe(503)
    await expect(rejected.json()).resolves.toEqual({
      code: "SERVICE_UNAVAILABLE",
      message: "서버가 종료 중입니다.",
    })
    expect(stop).toHaveBeenCalledWith(false)
    expect(closeCore).not.toHaveBeenCalled()

    finishRequest?.(new Response("완료"))
    await expect(inFlight.then((response) => response.text())).resolves.toBe(
      "완료"
    )
    await shutdown
    await lifecycle.shutdown()
    expect(closeCore).toHaveBeenCalledTimes(1)
  })

  it("SIGINT와 SIGTERM이 연달아 와도 같은 종료 작업만 실행한다", async () => {
    const listeners = new Map<string, () => void>()
    const closeCore = vi.fn()
    const lifecycle = createLearnerApiServerLifecycle({
      closeCore,
      fetch: () => new Response(),
      onShutdownError: vi.fn(),
    })
    lifecycle.attachServer({ stop: vi.fn() })
    registerLearnerApiShutdownSignals(
      lifecycle.shutdown,
      (signal, listener) => {
        listeners.set(signal, listener)
      }
    )

    listeners.get("SIGINT")?.()
    listeners.get("SIGTERM")?.()
    await lifecycle.shutdown()
    expect(closeCore).toHaveBeenCalledTimes(1)
  })

  it("server 중지와 core 종료 오류를 단계별로 기록한다", async () => {
    const onShutdownError = vi.fn()
    const lifecycle = createLearnerApiServerLifecycle({
      closeCore() {
        throw new Error("close 실패")
      },
      fetch: () => new Response(),
      onShutdownError,
    })
    lifecycle.attachServer({
      stop() {
        throw new Error("stop 실패")
      },
    })

    await lifecycle.shutdown()
    expect(onShutdownError.mock.calls.map(([, phase]) => phase)).toEqual([
      "stop-server",
      "close-core",
    ])
  })
})
