"use client"

import type { LessonDraftSyncStatus } from "@/features/lesson-session/hooks/use-lesson-draft-sync"
import { Button } from "@workspace/ui/components/ui/button"
import { Callout, CalloutContent } from "@workspace/ui/components/ui/callout"

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
        <p className="mt-4 text-label-md text-fg-muted" role="status">
          입력하면 서버에 자동 저장됩니다.
        </p>
      )
    case "saving":
      return (
        <p className="mt-4 text-label-md text-fg-muted" role="status">
          서버에 저장 중…
        </p>
      )
    case "saved":
      return (
        <p className="mt-4 text-label-md text-success-fg" role="status">
          서버에 저장됨
        </p>
      )
    case "offline":
      return (
        <Callout className="mt-4" role="alert" tone="danger">
          <CalloutContent>
            <p>
              오프라인입니다. 작성 내용은 이 화면에 유지되며 연결되면 다시
              저장합니다.
            </p>
            <Button className="mt-3" onClick={onRetry} size="sm" type="button">
              다시 저장
            </Button>
          </CalloutContent>
        </Callout>
      )
    case "error":
      return (
        <Callout className="mt-4" role="alert" tone="danger">
          <CalloutContent>
            <p>{status.message}</p>
            <Button className="mt-3" onClick={onRetry} size="sm" type="button">
              다시 저장
            </Button>
          </CalloutContent>
        </Callout>
      )
    case "conflict":
      return (
        <Callout className="mt-4" role="alert" tone="danger">
          <CalloutContent>
            <div aria-label="초안 충돌 해결" role="group">
              <p>
                다른 탭이나 기기에서 초안이 변경되었습니다. 현재 작성 내용은
                그대로 보존했습니다.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={onRetryLocal}
                  size="sm"
                  type="button"
                  variant="ink"
                >
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
            </div>
          </CalloutContent>
        </Callout>
      )
  }
}
