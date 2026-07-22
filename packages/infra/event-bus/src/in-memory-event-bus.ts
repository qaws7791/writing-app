import Emittery from "emittery"
import { ResultAsync } from "@workspace/kernel/result"

export const inMemoryEventDelivery = "best-effort-process-local" as const

export type EventMap = Readonly<Record<string, unknown>>

export type EventDispatchError<TEventName extends string = string> = Readonly<{
  causes: readonly unknown[]
  eventName: TEventName
  kind: "event-dispatch-failed"
}>

export type InMemoryEventBus<TEvents extends EventMap> = {
  readonly delivery: typeof inMemoryEventDelivery
  readonly publish: <TName extends keyof TEvents & string>(
    eventName: TName,
    event: TEvents[TName]
  ) => ResultAsync<void, EventDispatchError<TName>>
  readonly subscribe: <TName extends keyof TEvents & string>(
    eventName: TName,
    listener: (event: TEvents[TName]) => Promise<void> | void
  ) => () => void
}

export function createInMemoryEventBus<
  TEvents extends EventMap,
>(): InMemoryEventBus<TEvents> {
  const emitter = new Emittery<Record<string, unknown>>()
  const listeners = new Map<
    keyof TEvents & string,
    Set<(event: never) => Promise<void> | void>
  >()
  const registeredDispatchers = new Set<keyof TEvents & string>()

  return {
    delivery: inMemoryEventDelivery,
    publish(eventName, event) {
      return ResultAsync.fromPromise(
        emitter.emit(eventName, event),
        (cause): EventDispatchError<typeof eventName> => ({
          causes: flattenAggregateErrors(cause),
          eventName,
          kind: "event-dispatch-failed",
        })
      )
    },
    subscribe(eventName, listener) {
      let eventListeners = listeners.get(eventName)
      if (eventListeners === undefined) {
        eventListeners = new Set()
        listeners.set(eventName, eventListeners)
      }
      eventListeners.add(listener as (event: never) => Promise<void> | void)

      if (!registeredDispatchers.has(eventName)) {
        registeredDispatchers.add(eventName)
        emitter.on(eventName, async (event) => {
          const currentListeners = [...(listeners.get(eventName) ?? [])]
          const results = await Promise.allSettled(
            currentListeners.map(async (currentListener) =>
              currentListener(event as never)
            )
          )
          const causes = results.flatMap((result) =>
            result.status === "rejected" ? [result.reason] : []
          )
          if (causes.length > 0) throw new AggregateError(causes)
        })
      }

      let subscribed = true
      return () => {
        if (!subscribed) return
        subscribed = false
        eventListeners?.delete(
          listener as (event: never) => Promise<void> | void
        )
      }
    },
  }
}

function flattenAggregateErrors(cause: unknown): readonly unknown[] {
  return cause instanceof AggregateError
    ? cause.errors.flatMap(flattenAggregateErrors)
    : [cause]
}
