import Link from "next/link"
import { notFound } from "next/navigation"

import { StepForm } from "@/components/step-form"

type Props = { params: Promise<{ id: string; sessionId: string }> }

export default async function NewStepPage({ params }: Props) {
  const { id, sessionId } = await params
  const journeyId = Number(id)
  const sessionIdNum = Number(sessionId)
  if (Number.isNaN(journeyId) || Number.isNaN(sessionIdNum)) notFound()

  return (
    <div className="space-y-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Link href="/journeys" className="hover:underline">
          여정 관리
        </Link>
        <span>/</span>
        <Link href={`/journeys/${journeyId}`} className="hover:underline">
          여정
        </Link>
        <span>/</span>
        <Link
          href={`/journeys/${journeyId}/sessions/${sessionIdNum}`}
          className="hover:underline"
        >
          세션
        </Link>
        <span>/</span>
        <span>새 스텝</span>
      </div>
      <h1 className="text-xl font-semibold">새 스텝 추가</h1>
      <div className="max-w-2xl">
        <StepForm journeyId={journeyId} sessionId={sessionIdNum} />
      </div>
    </div>
  )
}
