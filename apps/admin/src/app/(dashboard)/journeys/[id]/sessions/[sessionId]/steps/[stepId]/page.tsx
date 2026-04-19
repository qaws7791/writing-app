import { eq } from "drizzle-orm"
import Link from "next/link"
import { notFound } from "next/navigation"

import { journeys, journeySessions, steps } from "@workspace/database"
import { parseJourneyId, parseSessionId, parseStepId } from "@workspace/core"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/ui/breadcrumb"

import { StepForm } from "@/components/step-form"
import { getDb } from "@/lib/db"

type Props = {
  params: Promise<{ id: string; sessionId: string; stepId: string }>
}

export default async function StepDetailPage({ params }: Props) {
  const { id, sessionId, stepId } = await params
  const rawId = Number(id)
  const rawSessionId = Number(sessionId)
  const rawStepId = Number(stepId)
  if (
    !Number.isInteger(rawId) ||
    rawId <= 0 ||
    !Number.isInteger(rawSessionId) ||
    rawSessionId <= 0 ||
    !Number.isInteger(rawStepId) ||
    rawStepId <= 0
  )
    notFound()
  const journeyId = parseJourneyId(rawId)
  const sessionIdNum = parseSessionId(rawSessionId)
  const stepIdNum = parseStepId(rawStepId)

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
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/journeys" />}>
              여정 관리
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={`/journeys/${journeyId}`} />}>
              {journey.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={
                <Link
                  href={`/journeys/${journeyId}/sessions/${sessionIdNum}`}
                />
              }
            >
              {session.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>스텝 {step.order}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
