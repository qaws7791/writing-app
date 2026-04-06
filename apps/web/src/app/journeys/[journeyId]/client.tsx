"use client"

import { useRouter } from "next/navigation"
import JourneyDetailView from "@/views/journey-detail-view"

const JOURNEY_DETAIL_THUMBNAIL =
  "https://www.figma.com/api/mcp/asset/c6b65f07-a7d0-4a31-b8c7-1e75acfd3b0b"

const MOCK_JOURNEYS: Record<
  string,
  {
    title: string
    description: string
    thumbnailUrl: string
    sessions: {
      id: string
      order: number
      title: string
      description?: string
      status: "COMPLETED" | "IN_PROGRESS" | "LOCKED"
    }[]
  }
> = {
  "1": {
    title: "내 주장을 설득력 있게",
    description:
      "자신의 생각을 명확하고 설득력 있게 글로 표현하는 방법을 배웁니다. 논리적 구조, 근거 제시, 반론 처리까지 에세이 작성의 핵심 기술을 단계별로 익혀보세요.",
    thumbnailUrl: JOURNEY_DETAIL_THUMBNAIL,
    sessions: [
      {
        id: "s1",
        order: 1,
        title: "주장과 근거의 관계",
        status: "COMPLETED",
      },
      {
        id: "s2",
        order: 2,
        title: "나의 첫 번째 주장 쓰기",
        description:
          "일상에서 기억에 남는 불편함이나 바라는 변화를 주제로, 짧은 주장 글을 써봅니다. 주장 한 문장과 이유 두 가지를 담아보세요.",
        status: "IN_PROGRESS",
      },
      {
        id: "s3",
        order: 3,
        title: "반론 예상하고 답하기",
        status: "LOCKED",
      },
      {
        id: "s4",
        order: 4,
        title: "독자를 고려한 글쓰기",
        status: "LOCKED",
      },
      {
        id: "s5",
        order: 5,
        title: "설득력 있는 마무리",
        status: "LOCKED",
      },
    ],
  },
}

export default function JourneyDetailClientPage({
  journeyId,
}: {
  journeyId: string
}) {
  const router = useRouter()
  const journey = MOCK_JOURNEYS[journeyId]

  if (!journey) {
    router.replace("/")
    return null
  }

  const completedCount = journey.sessions.filter(
    (s) => s.status === "COMPLETED"
  ).length

  return (
    <JourneyDetailView
      data={{
        id: journeyId,
        title: journey.title,
        description: journey.description,
        thumbnailUrl: journey.thumbnailUrl,
        completedCount,
        totalCount: journey.sessions.length,
        sessions: journey.sessions,
      }}
    />
  )
}
