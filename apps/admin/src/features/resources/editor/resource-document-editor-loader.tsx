"use client"

import dynamic from "next/dynamic"
import { Spinner } from "@workspace/ui/components/ui/spinner"

const ResourceDocumentEditor = dynamic(
  () =>
    import("@/features/resources/editor/resource-document-editor").then(
      (module) => module.ResourceDocumentEditor
    ),
  {
    loading: () => (
      <div className="grid min-h-60 place-items-center" role="status">
        <Spinner aria-hidden="true" />
        <span className="sr-only">문서 편집기를 불러오는 중입니다.</span>
      </div>
    ),
    ssr: false,
  }
)

export { ResourceDocumentEditor }
