import { revalidatePath } from "next/cache"

import { AdminResourcesPage } from "@/features/resources/admin-resources-page"
import { createTiptapDocumentFromPlainText } from "@/features/resources/resource-document-content"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import type { ReadAdminResourcesInput } from "@/lib/api/admin-api"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"
import { contentStatusSchema } from "@workspace/contracts/status"

export default async function AdminResourcesRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const filters = readResourceFilters(resolvedSearchParams)
  const api = getServerAdminApi({
    tokenProvider: getServerAdminSessionToken,
  })
  const documentsResult = await api.getResourceDocuments(filters)

  async function createResourceDocument(formData: FormData) {
    "use server"

    const serverApi = getServerAdminApi({
      tokenProvider: getServerAdminSessionToken,
    })
    const result = await serverApi.createResourceDocument({
      content: createTiptapDocumentFromPlainText(
        readFormString(formData, "body")
      ),
      title: readFormString(formData, "title"),
    })

    if (result.status === "ok") {
      revalidatePath("/resources")
    }

    return result
  }

  return (
    <AdminResourcesPage
      createResourceDocument={createResourceDocument}
      documentsResult={documentsResult}
      filters={filters}
    />
  )
}

function readResourceFilters(
  searchParams: Record<string, string | string[] | undefined>
): ReadAdminResourcesInput {
  return {
    page: readPositiveInteger(searchParams["page"], 1),
    pageSize: readPositiveInteger(searchParams["pageSize"], 20),
    query: readString(searchParams["query"], ""),
    status: readResourceStatus(readString(searchParams["status"], "all")),
  }
}

function readFormString(formData: FormData, name: string): string {
  const value = formData.get(name)

  return typeof value === "string" ? value : ""
}

function readString(value: string | string[] | undefined, fallback: string) {
  return typeof value === "string" ? value : fallback
}

function readPositiveInteger(
  value: string | string[] | undefined,
  fallback: number
) {
  const parsed = Number(readString(value, ""))

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function readResourceStatus(value: string): ReadAdminResourcesInput["status"] {
  const status = contentStatusSchema.safeParse(value)

  return status.success ? status.data : "all"
}
