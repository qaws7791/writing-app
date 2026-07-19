import {
  adminResourceDocumentDtoSchema,
  adminResourceImageUploadDtoSchema,
} from "@workspace/contracts/admin"

import type {
  AdminResourceDocument,
  AdminResourceImage,
} from "@/entities/resource-document/model/resource-document"
import type { AdminHttpTransport } from "@/shared/http/admin-http-transport"

export function createResourceDocumentHttpAdapter(
  transport: AdminHttpTransport
) {
  return {
    async exportResourceDocument(documentId: string) {
      const result = await transport.requestDownload({
        contentType: "text/markdown",
        path: `/api/admin/resources/documents/${documentId}/export`,
      })
      return result.status === "error"
        ? result
        : {
            status: "ok" as const,
            value: {
              fileName: result.value.fileName,
              markdown: result.value.body,
            },
          }
    },
    getResourceDocument: (documentId: string) =>
      transport.requestJson({
        method: "GET",
        path: `/api/admin/resources/documents/${documentId}`,
        schema: adminResourceDocumentDtoSchema,
      }),
  }
}

export function parseResourceDocument(
  value: unknown
): AdminResourceDocument | null {
  const result = adminResourceDocumentDtoSchema.safeParse(value)
  return result.success ? result.data : null
}

export function parseResourceImage(value: unknown): AdminResourceImage | null {
  const result = adminResourceImageUploadDtoSchema.safeParse(value)
  return result.success ? result.data : null
}
