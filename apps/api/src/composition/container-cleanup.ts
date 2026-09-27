type ContainerCleanupName = "database" | "logger" | "reporting-database"

export type ContainerCleanupFailure = Readonly<{
  cause: unknown
  name: ContainerCleanupName
}>

type ContainerCleanup = () => Promise<void> | void

export type ContainerCleanupCoordinator = Readonly<{
  dispose: () => Promise<readonly ContainerCleanupFailure[]>
  register: (name: ContainerCleanupName, cleanup: ContainerCleanup) => void
}>

export function createContainerCleanupCoordinator(
  options: {
    readonly onFailure?: (_failure: ContainerCleanupFailure) => void
  } = {}
): ContainerCleanupCoordinator {
  const entries: { cleanup: ContainerCleanup; name: ContainerCleanupName }[] =
    []
  let disposePromise: Promise<readonly ContainerCleanupFailure[]> | undefined

  return {
    dispose() {
      disposePromise ??= disposeInReverse(entries, options.onFailure)
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
  }[],
  onFailure: ((_failure: ContainerCleanupFailure) => void) | undefined
): Promise<readonly ContainerCleanupFailure[]> {
  const failures: ContainerCleanupFailure[] = []

  for (const entry of [...entries].reverse()) {
    try {
      await entry.cleanup()
    } catch (cause) {
      const failure = { cause, name: entry.name }
      failures.push(failure)
      try {
        onFailure?.(failure)
      } catch {
        // 실패 보고가 남은 resource 정리를 막아서는 안 된다.
      }
    }
  }

  return failures
}
