import type { CoreContainer } from "@workspace/core/composition/container"

export type EventWiring = {
  readonly dispose: () => void
}

export function wireCoreEvents(_container: CoreContainer): EventWiring {
  const unsubscribers: Array<() => void> = []

  return {
    dispose() {
      for (const unsubscribe of unsubscribers) {
        unsubscribe()
      }
    },
  }
}
