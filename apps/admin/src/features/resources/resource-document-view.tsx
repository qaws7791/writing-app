import type { AdminResourceLibraryDocument } from "@/lib/api/admin-api"
import {
  ResourceBreadcrumb,
  ResourceDocumentMetadata,
} from "@/features/resources/resource-breadcrumb"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Badge } from "@workspace/ui/components/ui/badge"
import { Markdown } from "@workspace/ui/components/ui/markdown"

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
          exactUpdatedAt={formatExactDate(document.updatedAt)}
          relativeUpdatedAt={formatRelativeDate(document.updatedAt)}
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

function formatExactDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(value))
}

function formatRelativeDate(value: string): string {
  const differenceInSeconds = Math.round(
    (new Date(value).getTime() - Date.now()) / 1_000
  )
  const absoluteSeconds = Math.abs(differenceInSeconds)
  const [amount, unit] =
    absoluteSeconds < 60
      ? [differenceInSeconds, "second"]
      : absoluteSeconds < 3_600
        ? [Math.round(differenceInSeconds / 60), "minute"]
        : absoluteSeconds < 86_400
          ? [Math.round(differenceInSeconds / 3_600), "hour"]
          : absoluteSeconds < 2_592_000
            ? [Math.round(differenceInSeconds / 86_400), "day"]
            : absoluteSeconds < 31_536_000
              ? [Math.round(differenceInSeconds / 2_592_000), "month"]
              : [Math.round(differenceInSeconds / 31_536_000), "year"]

  return new Intl.RelativeTimeFormat("ko-KR", { numeric: "auto" }).format(
    amount,
    unit as Intl.RelativeTimeFormatUnit
  )
}
