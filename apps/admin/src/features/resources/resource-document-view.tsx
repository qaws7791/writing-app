import type { AdminResourceLibraryDocument } from "@/lib/api/admin-api"
import {
  ResourceBreadcrumb,
  ResourceDocumentMetadata,
} from "@/features/resources/resource-breadcrumb"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Badge } from "@workspace/ui/components/ui/badge"
import { Markdown } from "@workspace/ui/components/ui/markdown"

import {
  formatResourceExactDate,
  formatResourceRelativeDate,
} from "@/features/resources/resource-document-date"

export function ResourceDocumentView({
  document,
}: {
  readonly document: AdminResourceLibraryDocument
}) {
  return (
    <article className="mx-auto grid w-full max-w-4xl gap-6 px-6 pt-16 pb-24 md:px-12 md:pt-12">
      <header className="grid gap-4 border-b border-border/60 pb-6">
        <ResourceBreadcrumb currentName={document.name} path={document.path} />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="min-w-0 flex-1 text-3xl font-black tracking-tight text-foreground md:text-4xl">
            {document.name}
          </h1>
          {document.status === "archived" ? (
            <Badge variant="outline">휴지통</Badge>
          ) : null}
        </div>
        <ResourceDocumentMetadata
          createdBy={document.createdBy.name}
          exactUpdatedAt={formatResourceExactDate(document.updatedAt)}
          relativeUpdatedAt={formatResourceRelativeDate(document.updatedAt)}
          updatedBy={document.updatedBy.name}
        />
      </header>
      {document.status === "archived" ? (
        <Alert tone="info">
          <AlertDescription>
            휴지통에 있는 문서입니다. 왼쪽 자료 트리에서 최상위 삭제 항목을
            복원할 수 있습니다.
          </AlertDescription>
        </Alert>
      ) : null}
      {document.contentMarkdown.trim() === "" ? (
        <p className="text-muted-foreground">아직 작성된 내용이 없습니다.</p>
      ) : (
        <Markdown>{document.contentMarkdown}</Markdown>
      )}
    </article>
  )
}
