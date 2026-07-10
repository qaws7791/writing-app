import type { AdminResourceTreeScope } from "@/lib/api/admin-api"

const expandedResourceIdsStorageVersion = "v1"
const emptyExpandedResourceIds: string[] = []
const expandedResourceIdsSnapshots = new Map<string, string[]>()
const expandedResourceIdsSubscribers = new Map<string, Set<() => void>>()

type ExpandedResourceIdsUpdater =
  | readonly string[]
  | ((currentIds: string[]) => readonly string[])

export function readExpandedResourceIds(
  storage: Storage,
  adminId: string,
  scope: AdminResourceTreeScope
): readonly string[] {
  try {
    const serialized = storage.getItem(
      expandedResourceIdsStorageKey(adminId, scope)
    )

    if (serialized === null) {
      return []
    }

    const value: unknown = JSON.parse(serialized)

    return Array.isArray(value) && value.every(isNonEmptyString)
      ? [...new Set(value)]
      : []
  } catch {
    return []
  }
}

export function writeExpandedResourceIds(
  storage: Storage,
  adminId: string,
  scope: AdminResourceTreeScope,
  expandedIds: readonly string[]
): void {
  try {
    storage.setItem(
      expandedResourceIdsStorageKey(adminId, scope),
      JSON.stringify([...new Set(expandedIds.filter(isNonEmptyString))])
    )
  } catch {
    return
  }
}

export function mergeExpandedResourceIds(
  currentIds: readonly string[],
  additionalIds: readonly string[]
): readonly string[] {
  return [...new Set([...currentIds, ...additionalIds])]
}

export function getExpandedResourceIdsSnapshot(
  adminId: string,
  scope: AdminResourceTreeScope
): string[] {
  const key = expandedResourceIdsStorageKey(adminId, scope)
  const cached = expandedResourceIdsSnapshots.get(key)
  if (cached !== undefined) return cached

  const expandedIds = [...readExpandedResourceIds(localStorage, adminId, scope)]
  expandedResourceIdsSnapshots.set(key, expandedIds)
  return expandedIds
}

export function getServerExpandedResourceIdsSnapshot(): string[] {
  return emptyExpandedResourceIds
}

export function subscribeExpandedResourceIds(
  adminId: string,
  scope: AdminResourceTreeScope,
  onChange: () => void
): () => void {
  const key = expandedResourceIdsStorageKey(adminId, scope)
  const subscribers = expandedResourceIdsSubscribers.get(key) ?? new Set()
  subscribers.add(onChange)
  expandedResourceIdsSubscribers.set(key, subscribers)

  function handleStorage(event: StorageEvent): void {
    if (event.storageArea !== localStorage || event.key !== key) return
    expandedResourceIdsSnapshots.set(key, [
      ...readExpandedResourceIds(localStorage, adminId, scope),
    ])
    onChange()
  }

  window.addEventListener("storage", handleStorage)
  return () => {
    subscribers.delete(onChange)
    if (subscribers.size === 0) expandedResourceIdsSubscribers.delete(key)
    window.removeEventListener("storage", handleStorage)
  }
}

export function updateExpandedResourceIds(
  adminId: string,
  scope: AdminResourceTreeScope,
  updater: ExpandedResourceIdsUpdater
): void {
  const key = expandedResourceIdsStorageKey(adminId, scope)
  const currentIds = getExpandedResourceIdsSnapshot(adminId, scope)
  const updatedIds =
    typeof updater === "function" ? updater(currentIds) : updater
  const nextIds = [...new Set(updatedIds.filter(isNonEmptyString))]

  expandedResourceIdsSnapshots.set(key, nextIds)
  writeExpandedResourceIds(localStorage, adminId, scope, nextIds)
  for (const subscriber of expandedResourceIdsSubscribers.get(key) ?? []) {
    subscriber()
  }
}

function expandedResourceIdsStorageKey(
  adminId: string,
  scope: AdminResourceTreeScope
): string {
  return `writing-app:resource-library:expanded:${expandedResourceIdsStorageVersion}:${adminId}:${scope}`
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}
