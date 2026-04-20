export function unwrapApiResult<TData>(result: {
  data?: TData
  error?: unknown
}): TData | undefined {
  if (result.error) {
    throw result.error
  }

  return result.data
}

export function unwrapRequiredApiResult<TData>(
  result: {
    data?: TData
    error?: unknown
  },
  emptyMessage: string
): TData {
  const data = unwrapApiResult(result)

  if (data === undefined) {
    throw new Error(emptyMessage)
  }

  return data
}
