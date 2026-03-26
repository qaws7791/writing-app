import type { DraftSummary } from "@/domain/draft"
import { DraftListItem } from "@/features/writing/components/draft-list-item"

type DraftListSectionProps = {
  drafts: DraftSummary[] | undefined
  isError: boolean
  isLoading: boolean
}

export function DraftListSection({
  drafts,
  isError,
  isLoading,
}: DraftListSectionProps) {
  if (isLoading) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        초안 목록을 불러오는 중입니다.
      </p>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
        초안 목록을 불러오지 못했습니다. 그래도 새 글은 바로 시작할 수 있습니다.
      </div>
    )
  }

  if (!drafts || drafts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        아직 작성한 초안이 없습니다. 오늘의 첫 문장을 여기서 시작할 수 있습니다.
      </p>
    )
  }

  return (
    <div className="flex flex-col">
      {drafts.map((draft, index) => (
        <DraftListItem
          key={draft.id}
          draft={draft}
          isLast={index === drafts.length - 1}
        />
      ))}
    </div>
  )
}
