"use client"

import type {
  AdminSaveResourceDocumentInput,
  ResourceDocumentApi,
} from "@/entities/resource-document/model/resource-document"
import {
  createResourceDocumentHttpAdapter,
  parseResourceDocument,
  parseResourceImage,
} from "@/features/resource-document-editor/api/resource-document-http-adapter"
import { buildApiUrl } from "@/shared/config/api-base-url"
import { createAdminHttpTransport } from "@/shared/http/admin-http-transport"

export function createBrowserResourceDocumentApi(): ResourceDocumentApi {
  const httpApi = createResourceDocumentHttpAdapter(
    createAdminHttpTransport({
      fetch: globalThis.fetch.bind(globalThis),
      tokenProvider: () => null,
    })
  )

  return {
    ...httpApi,
    async saveResourceDocument(
      documentId: string,
      version: number,
      input: AdminSaveResourceDocumentInput
    ) {
      try {
        const response = await fetch(
          buildApiUrl(
            undefined,
            `/api/admin/resources/documents/${documentId}`
          ),
          {
            body: JSON.stringify(input),
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "If-Match": `"${version}"`,
            },
            method: "PUT",
          }
        )
        const parsed = parseResourceDocument(await readJson(response))
        if (response.status === 412 && parsed !== null) {
          return { latest: parsed, status: "conflict" }
        }
        if (!response.ok || parsed === null) {
          return { message: "문서를 저장하지 못했습니다.", status: "error" }
        }
        return { status: "ok", value: parsed }
      } catch {
        return { message: "네트워크 연결을 확인해 주세요.", status: "error" }
      }
    },
    async uploadResourceImage(documentId, file, altText) {
      try {
        const form = new FormData()
        form.set("altText", altText)
        form.set("file", file)
        const response = await fetch(
          buildApiUrl(
            undefined,
            `/api/admin/resources/documents/${documentId}/images`
          ),
          { body: form, credentials: "include", method: "POST" }
        )
        const parsed = parseResourceImage(await readJson(response))
        if (!response.ok || parsed === null) {
          return {
            message: "JPEG, PNG, WebP 이미지만 5MB까지 업로드할 수 있습니다.",
            status: "error",
          }
        }
        return { status: "ok", value: parsed }
      } catch {
        return { message: "이미지를 업로드하지 못했습니다.", status: "error" }
      }
    },
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown
  } catch {
    return null
  }
}
