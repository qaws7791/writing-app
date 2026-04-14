import { notFound } from "next/navigation"

import { Breadcrumbs } from "@workspace/ui/components/breadcrumbs"

import { StepForm } from "@/components/step-form"

type Props = { params: Promise<{ id: string; sessionId: string }> }

export default async function NewStepPage({ params }: Props) {
  const { id, sessionId } = await params
  const journeyId = Number(id)
  const sessionIdNum = Number(sessionId)
  if (Number.isNaN(journeyId) || Number.isNaN(sessionIdNum)) notFound()

  return (
    <div className="space-y-5">
      <Breadcrumbs>
        <Breadcrumbs.Item href="/journeys">여정 관리</Breadcrumbs.Item>
        <Breadcrumbs.Item href={`/journeys/${journeyId}`}>
          여정
        </Breadcrumbs.Item>
        <Breadcrumbs.Item
          href={`/journeys/${journeyId}/sessions/${sessionIdNum}`}
        >
          세션
        </Breadcrumbs.Item>
        <Breadcrumbs.Item
          href={`/journeys/${journeyId}/sessions/${sessionIdNum}/steps/new`}
        >
          새 스텝
        </Breadcrumbs.Item>
      </Breadcrumbs>

      <h1 className="text-xl font-semibold text-foreground">새 스텝 추가</h1>

      <div className="max-w-2xl">
        <StepForm journeyId={journeyId} sessionId={sessionIdNum} />
      </div>
    </div>
  )
}
