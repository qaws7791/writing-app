import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"

import type { AdminResourceDocument } from "@/features/resources/resource-library-model"

export function ResourceDocumentView({
  document,
}: {
  readonly document: AdminResourceDocument
}) {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5 px-8 pt-12">
      <h1 className="text-3xl font-black">{document.name}</h1>
      <Alert>
        <AlertDescription>
          휴지통의 문서는 편집할 수 없습니다. 왼쪽 휴지통에서 복원한 뒤 다시
          여세요.
        </AlertDescription>
      </Alert>
    </div>
  )
}
