import { ResourceDocumentView } from "@/features/resources/resource-document-view"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"

export default async function AdminResourceDocumentRoute({
  params,
}: {
  readonly params: Promise<{ readonly documentId: string }>
}) {
  const { documentId } = await params
  const result = await getServerAdminApi({
    tokenProvider: getServerAdminSessionToken,
  }).getResourceLibraryDocument(documentId)

  if (result.status === "error") {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 pt-16 md:px-12 md:pt-12">
        <Alert role="alert" tone="danger">
          <AlertDescription>{result.error.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return <ResourceDocumentView document={result.value} />
}
