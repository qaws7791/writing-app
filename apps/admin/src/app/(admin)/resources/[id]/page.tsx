import { revalidatePath } from "next/cache"

import { AdminResourceDetailPage } from "@/features/resources/admin-resources-page"
import { createTiptapDocumentFromPlainText } from "@/features/resources/resource-document-content"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminResourceDetailRoute({
  params,
}: {
  readonly params: Promise<{
    readonly id: string
  }>
}) {
  const { id } = await params
  const api = getServerAdminApi({
    tokenProvider: getServerAdminSessionToken,
  })
  const documentResult = await api.getResourceDocument(id)

  async function updateResourceDocument(formData: FormData) {
    "use server"

    const serverApi = getServerAdminApi({
      tokenProvider: getServerAdminSessionToken,
    })
    const result = await serverApi.updateResourceDocument(id, {
      content: createTiptapDocumentFromPlainText(
        readFormString(formData, "body")
      ),
      title: readFormString(formData, "title"),
    })

    if (result.status === "ok") {
      revalidatePath(`/resources/${id}`)
      revalidatePath("/resources")
    }

    return result
  }

  async function archiveResourceDocument() {
    "use server"

    const serverApi = getServerAdminApi({
      tokenProvider: getServerAdminSessionToken,
    })
    const result = await serverApi.archiveResourceDocument(id)

    if (result.status === "ok") {
      revalidatePath(`/resources/${id}`)
      revalidatePath("/resources")
    }

    return result
  }

  async function deleteResourceDocument() {
    "use server"

    const serverApi = getServerAdminApi({
      tokenProvider: getServerAdminSessionToken,
    })
    const result = await serverApi.deleteResourceDocument(id)

    if (result.status === "ok") {
      revalidatePath("/resources")
    }

    return result
  }

  return (
    <AdminResourceDetailPage
      archiveResourceDocument={archiveResourceDocument}
      deleteResourceDocument={deleteResourceDocument}
      documentResult={documentResult}
      updateResourceDocument={updateResourceDocument}
    />
  )
}

function readFormString(formData: FormData, name: string): string {
  const value = formData.get(name)

  return typeof value === "string" ? value : ""
}
