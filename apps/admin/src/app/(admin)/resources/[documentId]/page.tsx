import { ResourceDocumentEditor } from "@/features/resource-document-editor/ui/resource-document-editor-loader"
import { ResourceDocumentView } from "@/features/resource-document-editor/ui/resource-document-view"
import { createResourceDocumentHttpAdapter } from "@/features/resource-document-editor/api/resource-document-http-adapter"
import { getServerAdminHttpTransport } from "@/server/http/get-admin-http-transport"
import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"
import { readServerAdminApiBaseUrl } from "@/server/env/admin-runtime-config"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { resourceDocumentIdSchema } from "@/entities/resource-document/model/resource-document-id"
import { notFound } from "next/navigation"

export default async function AdminResourceDocumentRoute({
  params,
}: {
  readonly params: Promise<{ readonly documentId: string }>
}) {
  const documentId = resourceDocumentIdSchema.safeParse(
    (await params).documentId
  )
  if (!documentId.success) notFound()
  const result = await createResourceDocumentHttpAdapter(
    getServerAdminHttpTransport({ tokenProvider: getServerAdminSessionToken })
  ).getResourceDocument(documentId.data)

  if (result.status === "error") {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 pt-16 md:px-12 md:pt-12">
        <Alert role="alert" tone="danger">
          <AlertDescription>{result.error.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return result.value.status === "trashed" ? (
    <ResourceDocumentView document={result.value} />
  ) : (
    <ResourceDocumentEditor
      apiBaseUrl={readServerAdminApiBaseUrl()}
      document={result.value}
      key={`${result.value.id}:${result.value.version}`}
    />
  )
}
