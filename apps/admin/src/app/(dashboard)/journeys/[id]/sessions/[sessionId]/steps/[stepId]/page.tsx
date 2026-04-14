import { eq } from "drizzle-orm"
import Link from "next/link"
import { notFound } from "next/navigation"

import { journeys, journeySessions, steps } from "@workspace/database"

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
    <div className="space-y-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Link href="/journeys" className="hover:underline">
          여정 관리
        </Link>
        <span>/</span>
        <Link href={`/journeys/${journeyId}`} className="hover:underline">
          {journey.title}
        </Link>
        <span>/</span>
        <Link
          href={`/journeys/${journeyId}/sessions/${sessionIdNum}`}
          className="hover:underline"
        >
          {session.title}
        </Link>
        <span>/</span>
        <span>스텝 {step.order}</span>
      </div>
      <h1 className="text-xl font-semibold">스텝 편집</h1>
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
