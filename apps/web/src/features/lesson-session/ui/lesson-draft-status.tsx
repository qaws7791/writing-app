"use client"

import type { LessonDraftSyncStatus } from "@/features/lesson-session/hooks/use-lesson-draft-sync"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Insight,
  InsightDescription,
  InsightEyebrow,
  InsightTitle,
} from "@workspace/ui/components/ui/insight"

export function LessonDraftStatus({
  onRetry,
  onRetryLocal,
  onUseServer,
  status,
}: {
  readonly onRetry: () => void
  readonly onRetryLocal: () => void
  readonly onUseServer: () => void
  readonly status: LessonDraftSyncStatus
}) {
  switch (status.kind) {
    case "idle":
      return (
        <p className="text-xs text-muted-foreground" role="status">
          입력하면 서버에 자동 저장됩니다.
        </p>
      )
    case "saving":
      return (
        <p className="text-xs text-muted-foreground" role="status">
          서버에 저장 중…
        </p>
      )
    case "saved":
      return (
        <p className="text-xs text-foreground/75" role="status">
          서버에 저장됨
        </p>
      )
    case "offline":
      return (
        <DraftError
          description="작성 내용은 이 화면에 유지됩니다. 연결되면 다시 저장합니다."
          onRetry={onRetry}
          title="오프라인입니다."
        />
      )
    case "error":
      return (
        <DraftError
          description={status.message}
          onRetry={onRetry}
          title="초안을 저장하지 못했습니다."
        />
      )
    case "conflict":
      return (
        <Insight
          aria-label="초안 충돌 해결"
          aria-live="assertive"
          role="group"
          tone="incorrect"
        >
          <InsightEyebrow>초안 충돌</InsightEyebrow>
          <InsightTitle>
            다른 탭이나 기기에서 초안이 변경되었습니다.
          </InsightTitle>
          <InsightDescription>
            <p>현재 작성 내용은 그대로 보존했습니다.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={onRetryLocal} size="sm" type="button">
                현재 내용 다시 저장
              </Button>
              <Button
                onClick={onUseServer}
                size="sm"
                type="button"
                variant="secondary"
              >
                서버 초안 불러오기
              </Button>
            </div>
          </InsightDescription>
        </Insight>
      )
  }
}

function DraftError({
  description,
  onRetry,
  title,
}: {
  readonly description: string
  readonly onRetry: () => void
  readonly title: string
}) {
  return (
    <Insight role="alert" tone="incorrect">
      <InsightTitle>{title}</InsightTitle>
      <InsightDescription>
        <p>{description}</p>
        <Button className="mt-3" onClick={onRetry} size="sm" type="button">
          다시 저장
        </Button>
      </InsightDescription>
    </Insight>
  )
}
