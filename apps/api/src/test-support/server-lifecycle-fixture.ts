import type { ServerLifecycleScheduler } from "@/lifecycle/server-lifecycle"

export type Deferred<T> = Readonly<{
  promise: Promise<T>
  resolve: (_value: T | PromiseLike<T>) => void
}>

export type ControlledStream = Readonly<{
  cancelReasons: unknown[]
  close: () => void
  enqueue: (_value: string) => void
  error: (_error: unknown) => void
  response: Response
}>

type ScheduledLifecycleTask = {
  cancelled: boolean
  readonly delayMilliseconds: number
  ran: boolean
  readonly run: () => void
}

export type FakeLifecycleScheduler = Readonly<{
  delays: readonly number[]
  runNext: () => void
  tasks: readonly ScheduledLifecycleTask[]
  /** 관찰 대상 상태(예약된 task 수)에 대한 명시적 대기다. */
  waitForScheduledTaskCount: (_count: number) => Promise<void>
  value: ServerLifecycleScheduler
}>

export function createDeferred<T>(): Deferred<T> {
  let resolve: ((value: T | PromiseLike<T>) => void) | undefined
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })

  return {
    promise,
    resolve(value) {
      resolve?.(value)
    },
  }
}

export function createControlledStream(
  onCancel?: () => Promise<void> | void
): ControlledStream {
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

export function createFakeScheduler(): FakeLifecycleScheduler {
  const tasks: ScheduledLifecycleTask[] = []
  const scheduleWaiters: { count: number; resolve: () => void }[] = []
  const scheduler: ServerLifecycleScheduler = {
    schedule(delayMilliseconds, task) {
      const scheduledTask = {
        cancelled: false,
        delayMilliseconds,
        ran: false,
        run: task,
      }
      tasks.push(scheduledTask)
      for (const waiter of scheduleWaiters.splice(0)) {
        if (tasks.length >= waiter.count) {
          waiter.resolve()
        } else {
          scheduleWaiters.push(waiter)
        }
      }

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
    waitForScheduledTaskCount(count) {
      if (tasks.length >= count) return Promise.resolve()

      return new Promise<void>((resolve) => {
        scheduleWaiters.push({ count, resolve })
      })
    },
    value: scheduler,
  }
}
