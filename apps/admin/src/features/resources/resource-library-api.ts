"use client"

import { createHttpAdminApi } from "@/lib/api/http-admin-api"
import type { AdminApi } from "@/lib/api/admin-api"
import type { AdminApiBaseUrl } from "@/runtime-config"

export type ResourceLibraryApi = Pick<
  AdminApi,
  | "createResourceDocumentNode"
  | "createResourceFolder"
  | "getResourceTree"
  | "moveResourceNode"
  | "renameResourceNode"
  | "restoreResourceNode"
  | "searchResources"
  | "trashResourceNode"
>

export function createBrowserResourceLibraryApi(
  apiBaseUrl: AdminApiBaseUrl
): ResourceLibraryApi {
  return createHttpAdminApi({
    baseUrl: apiBaseUrl,
    fetch: globalThis.fetch.bind(globalThis),
    tokenProvider: () => null,
  })
}
