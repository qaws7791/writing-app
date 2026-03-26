import type { WritingSummary } from "@/domain/writing"
import { WritingListItem } from "@/features/writing/components/writing-list-item"

type WritingListSectionProps = {
  writings: WritingSummary[] | undefined
  isError: boolean
  isLoading: boolean
}

export function WritingListSection({
  writings,
  isError,
  isLoading,
}: WritingListSectionProps) {
  if (isLoading) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        글 목록을 불러오는 중입니다.
      </p>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
        글 목록을 불러오지 못했습니다. 그래도 새 글은 바로 시작할 수 있습니다.
      </div>
    )
  }

  if (!writings || writings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        아직 작성한 글이 없습니다. 오늘의 첫 문장을 여기서 시작할 수 있습니다.
      </p>
    )
  }

  return (
    <div className="flex flex-col">
      {writings.map((writing, index) => (
        <WritingListItem
          key={writing.id}
          writing={writing}
          isLast={index === writings.length - 1}
        />
      ))}
    </div>
  )
}
