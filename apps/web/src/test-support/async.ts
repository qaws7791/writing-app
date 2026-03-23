export function createDeferred<TValue>() {
  let resolve!: (value: TValue | PromiseLike<TValue>) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<TValue>((nextResolve, nextReject) => {
    resolve = nextResolve
    reject = nextReject
  })

  return {
    promise,
    reject,
    resolve,
  }
}
