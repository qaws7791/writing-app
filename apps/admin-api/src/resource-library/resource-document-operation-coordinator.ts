export type ResourceDocumentOperationCoordinator = {
  readonly run: <TResult>(
    documentId: string,
    operation: () => Promise<TResult>
  ) => Promise<TResult>
  readonly runMany: <TResult>(
    documentIds: readonly string[],
    operation: () => Promise<TResult>
  ) => Promise<TResult>
}

export function createResourceDocumentOperationCoordinator(): ResourceDocumentOperationCoordinator {
  const tails = new Map<string, Promise<void>>()

  async function runMany<TResult>(
    documentIds: readonly string[],
    operation: () => Promise<TResult>
  ): Promise<TResult> {
    const uniqueDocumentIds = [...new Set(documentIds)].sort()
    if (uniqueDocumentIds.length === 0) return operation()

    const predecessors = uniqueDocumentIds.map(
      (documentId) => tails.get(documentId) ?? Promise.resolve()
    )
    let release: () => void = () => undefined
    const reservation = new Promise<void>((resolve) => {
      release = resolve
    })
    for (const documentId of uniqueDocumentIds) {
      tails.set(documentId, reservation)
    }

    await Promise.all(predecessors)
    try {
      return await operation()
    } finally {
      release()
      for (const documentId of uniqueDocumentIds) {
        if (tails.get(documentId) === reservation) tails.delete(documentId)
      }
    }
  }

  return {
    run(documentId, operation) {
      return runMany([documentId], operation)
    },
    runMany,
  }
}
