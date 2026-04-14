import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"

import { journeys, journeySessions, steps } from "@workspace/database"
import { Breadcrumbs } from "@workspace/ui/components/breadcrumbs"

import { StepForm } from "@/components/step-form"
import { getDb } from "@/lib/db"

type Props = {
  params: Promise<{ id: string; sessionId: string; stepId: string }>
}

export default async function StepDetailPage({ params }: Props) {
  const { id, sessionId, stepId } = await params
  const journeyId = Number(id)
  const sessionIdNum = Number(sessionId)
  const stepIdNum = Number(stepId)
  if (
    Number.isNaN(journeyId) ||
    Number.isNaN(sessionIdNum) ||
    Number.isNaN(stepIdNum)
  )
    notFound()

  const db = getDb()
  const [[journey], [session], [step]] = await Promise.all([
    db.select().from(journeys).where(eq(journeys.id, journeyId)).limit(1),
    db
      .select()
      .from(journeySessions)
      .where(eq(journeySessions.id, sessionIdNum))
      .limit(1),
    db.select().from(steps).where(eq(steps.id, stepIdNum)).limit(1),
  ])

  if (!journey || !session || !step) notFound()

  return (
    <div className="space-y-5">
      <Breadcrumbs>
        <Breadcrumbs.Item href="/journeys">여정 관리</Breadcrumbs.Item>
        <Breadcrumbs.Item href={`/journeys/${journeyId}`}>
          {journey.title}
        </Breadcrumbs.Item>
        <Breadcrumbs.Item
          href={`/journeys/${journeyId}/sessions/${sessionIdNum}`}
        >
          {session.title}
        </Breadcrumbs.Item>
        <Breadcrumbs.Item
          href={`/journeys/${journeyId}/sessions/${sessionIdNum}/steps/${stepIdNum}`}
        >
          스텝 {step.order}
        </Breadcrumbs.Item>
      </Breadcrumbs>

      <h1 className="text-xl font-semibold text-foreground">스텝 편집</h1>

      <div className="max-w-2xl">
        <StepForm
          journeyId={journeyId}
          sessionId={sessionIdNum}
          stepId={step.id}
          defaultValues={{
            type: step.type,
            order: step.order,
            contentJson: step.contentJson,
          }}
        />
      </div>
    </div>
  )
}
