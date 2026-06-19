"use client"

import { LessonPrimaryButton } from "@/features/lessons/lesson-shell"

export function LessonExitModal({
  onCancel,
  onConfirm,
}: {
  readonly onCancel: () => void
  readonly onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-charcoal/30 backdrop-blur-sm">
      <div className="bg-cream rounded-4xl p-8 w-full max-w-md an-fi">
        <h3 className="font-bold mb-3" style={{ fontSize: "1.5rem" }}>
          학습을 중단할까요?
        </h3>
        <p
          className="text-muted font-medium mb-8"
          style={{ fontSize: "1.125rem" }}
        >
          진행 상황은 자동으로 저장되어 있어요.
        </p>
        <div className="flex gap-3">
          <LessonPrimaryButton onClick={onCancel} variant="secondary">
            계속 학습
          </LessonPrimaryButton>
          <LessonPrimaryButton onClick={onConfirm}>나가기</LessonPrimaryButton>
        </div>
      </div>
    </div>
  )
}
