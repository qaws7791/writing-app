import { Trash2Icon } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/ui/empty"

export default function AdminResourceTrashRoute() {
  return (
    <div className="flex min-h-full items-center justify-center px-6 py-20">
      <Empty>
        <EmptyMedia variant="icon">
          <Trash2Icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>휴지통</EmptyTitle>
          <EmptyDescription>
            왼쪽 트리에서 삭제된 문서를 확인하거나 최상위 삭제 항목을
            복원하세요.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
