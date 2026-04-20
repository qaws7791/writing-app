import type { QueryClient } from "@tanstack/react-query"

export function getPositiveId(value: number | undefined): number | null {
  return value !== undefined && value > 0 ? value : null
}

export function requirePositiveId(
  value: number | null,
  errorMessage: string
): number {
  if (value === null) {
    throw new Error(errorMessage)
  }

  return value
}

export function createDetailQueryKey(resource: string, id: number | undefined) {
  return [resource, "detail", id] as const
}

export function setDetailQueryData<TData>(
  queryClient: QueryClient,
  resource: string,
  id: number,
  data: TData
) {
  queryClient.setQueryData(createDetailQueryKey(resource, id), data)
}
