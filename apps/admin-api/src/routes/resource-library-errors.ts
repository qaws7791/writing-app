import type { ResourceTreeCommandRejection } from "@workspace/core/resource-library"

import {
  invalidAdminRequestError,
  notFoundAdminError,
  resourceLibraryConflictAdminError,
} from "@/errors/admin-errors"

type ResourceDocumentRejection =
  | ResourceTreeCommandRejection
  | { readonly kind: "invalid-file-name" }
  | { readonly kind: "invalid-markdown" }

export function throwResourceLibraryRejection(
  rejection: ResourceDocumentRejection
): never {
  switch (rejection.kind) {
    case "cycle":
      throw resourceLibraryConflictAdminError("RESOURCE_MOVE_CYCLE")
    case "invalid-file-name":
    case "invalid-markdown":
    case "invalid-name":
      throw invalidAdminRequestError()
    case "depth-limit":
      throw resourceLibraryConflictAdminError("RESOURCE_DEPTH_LIMIT")
    case "name-conflict":
      throw resourceLibraryConflictAdminError("RESOURCE_NAME_CONFLICT")
    case "not-found":
    case "parent-not-found":
      throw notFoundAdminError()
    case "node-limit":
      throw resourceLibraryConflictAdminError("RESOURCE_NODE_LIMIT")
  }
}
