import { eq } from "drizzle-orm"
import Link from "next/link"
import { notFound } from "next/navigation"

import { journeys, journeySessions, steps } from "@workspace/database"

import { SessionForm } from "@/components/session-form"
import { StepList } from "@/components/step-list"
import { getDb } from "@/lib/db"

type Props = { params: Promise<{ id: string; sessionId: string }> }

export default async function SessionDetailPage({ params }: Props) {
  const { id, sessionId } = await params
  const journeyId = Number(id)
  const sessionIdNum = Number(sessionId)
  if (Number.isNaN(journeyId) || Number.isNaN(sessionIdNum)) notFound()

  const db = getDb()

  const [[journey], [session]] = await Promise.all([
    db.select().from(journeys).where(eq(journeys.id, journeyId)).limit(1),
    db
      .select()
      .from(journeySessions)
      .where(eq(journeySessions.id, sessionIdNum))
      .limit(1),
  ])

  if (!journey || !session) notFound()

  const sessionSteps = await db
    .select()
    .from(steps)
    .where(eq(steps.sessionId, sessionIdNum))
    .orderBy(steps.order)

  return (
    <div className="space-y-8">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Link href="/journeys" className="hover:underline">
          여정 관리
        </Link>
        <span>/</span>
        <Link href={`/journeys/${journeyId}`} className="hover:underline">
          {journey.title}
        </Link>
        <span>/</span>
        <span>{session.title}</span>
      </div>

      <section className="space-y-4">
        <h1 className="text-xl font-semibold">세션 편집</h1>
        <div className="max-w-lg">
          <SessionForm
            journeyId={journeyId}
            sessionId={session.id}
            defaultValues={{
              title: session.title,
              description: session.description,
              estimatedMinutes: session.estimatedMinutes,
              order: session.order,
            }}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">스텝 목록</h2>
          <Link
            href={`/journeys/${journeyId}/sessions/${sessionIdNum}/steps/new`}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
          >
            새 스텝 추가
          </Link>
        </div>
        <StepList
          steps={sessionSteps}
          journeyId={journeyId}
          sessionId={sessionIdNum}
        />
      </section>
    </div>
  )
}
