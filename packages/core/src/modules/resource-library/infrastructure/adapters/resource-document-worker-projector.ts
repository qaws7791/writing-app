import type {
  ResourceDocumentProjection,
  ResourceDocumentProjectionResult,
  ResourceDocumentProjector,
} from "#core/modules/resource-library/application/ports/resource-document-projector"

export function createResourceDocumentWorkerProjector(): ResourceDocumentProjector {
  return {
    project(input) {
      return projectInWorker(input)
    },
  }
}

function projectInWorker(input: {
  readonly snapshot: Uint8Array
  readonly timeoutMilliseconds: number
  readonly update: Uint8Array
}): Promise<ResourceDocumentProjectionResult> {
  const startedAt = performance.now()

  return new Promise((resolve) => {
    const worker = new Worker(
      new URL(
        "../workers/resource-document-projection.worker.ts",
        import.meta.url
      ).href
    )
    let settled = false
    const finish = (result: ResourceDocumentProjectionResult) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      worker.terminate()
      resolve(result)
    }
    const timeout = setTimeout(() => {
      finish({
        elapsedMilliseconds: performance.now() - startedAt,
        kind: "timeout",
      })
    }, input.timeoutMilliseconds)

    worker.onmessage = (event: MessageEvent<ResourceDocumentProjection>) => {
      finish({ kind: "completed", projection: event.data })
    }
    worker.onerror = (event) => {
      finish({
        cause: event.error ?? new Error(event.message),
        kind: "failed",
      })
    }
    worker.postMessage({ snapshot: input.snapshot, update: input.update })
  })
}
