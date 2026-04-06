"use client"

import { useRouter } from "next/navigation"
import PromptDetailView from "@/views/prompt-detail-view"

const MOCK_ESSAYS = [
  {
    id: "1",
    date: "2026.04.01",
    wordCount: 1240,
    title: "단순한 삶을 위한 뺄셈",
    preview:
      "서랍을 정리하며 지난 3년간 한 번도 꺼내지 않은 물건들을 골라냈다. 마음의 짐 또한 마찬가지였다.",
  },
  {
    id: "2",
    date: "2026.04.01",
    wordCount: 1240,
    title: "정적 속에서 들리는 소리",
    preview:
      "완전한 침묵이란 존재하지 않는다. 모든 소음이 걷힌 자리에는 심장 박동 소리와...",
  },
  {
    id: "3",
    date: "2026.04.01",
    wordCount: 1240,
    title: "흰 캔버스가 주는 위로",
    preview:
      "무언가를 그려야 한다는 압박에서 벗어나, 그저 하얀 공간을 응시하는 것만으로도...",
  },
]

const MOCK_PROMPTS: Record<
  number,
  {
    title: string
    description: string
    participantCount: number
    essayCount: number
  }
> = {
  1: {
    title: "오래된 서랍 속의 기억",
    description:
      "먼지 쌓인 서랍을 열었을 때, 당신의 시선을 멈추게 한 물건은 무엇인가요? 그 물건에 얽힌 작고 소중한 이야기를 들려주세요.",
    participantCount: 1204,
    essayCount: 3892,
  },
}

export default function PromptDetailClientPage({
  promptId,
}: {
  promptId: number
}) {
  const router = useRouter()
  const prompt = MOCK_PROMPTS[promptId] ?? {
    title: "글감",
    description: "",
    participantCount: 0,
    essayCount: 0,
  }

  function handleStartWriting() {
    router.push(`/writing?promptId=${promptId}`)
  }

  return (
    <PromptDetailView
      data={{
        id: promptId,
        ...prompt,
        essays: MOCK_ESSAYS,
      }}
      onStartWritingAction={handleStartWriting}
    />
  )
}
