import type { AdminId, ResourceDocumentId } from "@workspace/types/ids"
import { err, ok, type Result } from "@workspace/kernel/result"

import type { ResourceActorProfile } from "#resource-library/domain/resource-access-policy"
import type { ResourceConflictError } from "#resource-library/domain/resource-library-error"
import type {
  ResourceBreadcrumbItem,
  ResourceFolderId,
  ResourceNodeStatus,
} from "#resource-library/domain/resource-tree-node"

export type ResourceDocumentRecord = Readonly<{
  contentMarkdown: string
  createdAt: Date
  createdById: AdminId
  id: ResourceDocumentId
  name: string
  parentId: ResourceFolderId | null
  path: readonly ResourceBreadcrumbItem[]
  status: ResourceNodeStatus
  updatedAt: Date
  updatedById: AdminId
  version: number
}>

export type ResourceDocument = Omit<
  ResourceDocumentRecord,
  "createdById" | "updatedById"
> &
  Readonly<{
    createdBy: ResourceActorProfile
    updatedBy: ResourceActorProfile
  }>

export function validateResourceDocumentVersion(
  document: ResourceDocument,
  expectedVersion: number
): Result<void, ResourceConflictError> {
  return document.version === expectedVersion
    ? ok(undefined)
    : err({
        document,
        kind: "resource-conflict",
        reason: "stale-version",
      })
}

export function nextResourceDocumentVersion(version: number): number {
  if (!Number.isSafeInteger(version) || version < 0) {
    throw new TypeError("자료 문서 버전은 0 이상의 안전한 정수여야 합니다.")
  }

  return version + 1
}
