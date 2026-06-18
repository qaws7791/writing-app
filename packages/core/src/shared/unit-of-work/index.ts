import type { AppAsyncResult } from "@workspace/core/shared/result"

export type UnitOfWork = {
  readonly run: <TValue>(
    work: () => AppAsyncResult<TValue>
  ) => AppAsyncResult<TValue>
}

export function createPassthroughUnitOfWork(): UnitOfWork {
  return {
    run(work) {
      return work()
    },
  }
}
