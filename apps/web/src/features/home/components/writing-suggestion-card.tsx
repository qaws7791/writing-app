"use client"

import { useRouter } from "next/navigation"

export function WritingSuggestionCard() {
  const router = useRouter()

  return (
    <div className="mt-8 px-4">
      <button
        type="button"
        onClick={() => router.push("/writings/new")}
        className="flex w-full flex-col gap-2 rounded-3xl bg-secondary-container p-6 text-left transition-colors hover:opacity-90"
      >
        <p className="text-title-medium-em text-on-surface">
          오늘 자유롭게 글을 써보세요
        </p>
        <p className="text-body-medium text-on-surface-low">
          여정 밖에서도 자유롭게 생각을 기록할 수 있어요
        </p>
      </button>
    </div>
  )
}
