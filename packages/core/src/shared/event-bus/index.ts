import { ResultAsync, type AppAsyncResult } from "@workspace/core/shared/result"

export type DomainEvent<TType extends string = string, TPayload = unknown> = {
  readonly occurredAt: Date
  readonly payload: TPayload
  readonly type: TType
}

export type EventHandler<TEvent extends DomainEvent = DomainEvent> = (
  event: TEvent
) => AppAsyncResult<void>

export type EventBus = {
  readonly publish: (event: DomainEvent) => AppAsyncResult<void>
  readonly subscribe: <TEvent extends DomainEvent>(
    type: TEvent["type"],
    handler: EventHandler<TEvent>
  ) => () => void
}

export function createLocalEventBus(): EventBus {
  const handlers = new Map<string, Set<EventHandler>>()

  return {
    publish(event) {
      const subscribers = [...(handlers.get(event.type) ?? [])]
      let result: AppAsyncResult<void> = ResultAsync.fromSafePromise(
        Promise.resolve(undefined)
      )

      for (const handler of subscribers) {
        result = result.andThen(() => handler(event))
      }

      return result
    },
    subscribe(type, handler) {
      const subscribers = handlers.get(type) ?? new Set<EventHandler>()
      subscribers.add(handler as EventHandler)
      handlers.set(type, subscribers)

      return () => {
        subscribers.delete(handler as EventHandler)
      }
    },
  }
}
