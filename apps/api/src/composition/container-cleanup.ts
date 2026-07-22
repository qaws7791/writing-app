export type ContainerCleanupName =
  | "ai"
  | "database"
  | "event-subscriptions"
  | "logger"

export type ContainerCleanupFailure = Readonly<{
  cause: unknown
  name: ContainerCleanupName
}>

type ContainerCleanup = () => Promise<void> | void

export type ContainerCleanupCoordinator = Readonly<{
  dispose: () => Promise<readonly ContainerCleanupFailure[]>
  register: (name: ContainerCleanupName, cleanup: ContainerCleanup) => void
}>

export function createContainerCleanupCoordinator(): ContainerCleanupCoordinator {
  const entries: { cleanup: ContainerCleanup; name: ContainerCleanupName }[] =
    []
  let disposePromise: Promise<readonly ContainerCleanupFailure[]> | undefined

  return {
    dispose() {
      disposePromise ??= disposeInReverse(entries)
      return disposePromise
    },
    register(name, cleanup) {
      if (disposePromise !== undefined) {
        throw new Error(
          "정리가 시작된 API container에는 resource를 등록할 수 없습니다."
        )
      }
      entries.push({ cleanup, name })
    },
  }
}

async function disposeInReverse(
  entries: readonly {
    readonly cleanup: ContainerCleanup
    readonly name: ContainerCleanupName
  }[]
): Promise<readonly ContainerCleanupFailure[]> {
  const failures: ContainerCleanupFailure[] = []

  for (const entry of [...entries].reverse()) {
    try {
      await entry.cleanup()
    } catch (cause) {
      failures.push({ cause, name: entry.name })
    }
  }

  return Object.freeze(failures)
}
