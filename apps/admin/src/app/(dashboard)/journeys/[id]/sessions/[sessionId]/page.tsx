import { eq } from "drizzle-orm"
import Link from "next/link"
import { notFound } from "next/navigation"

import { journeys, journeySessions, steps } from "@workspace/database"
import { parseJourneyId, parseSessionId } from "@workspace/core"
import { cn } from "@workspace/ui"
import { buttonVariants } from "@workspace/ui/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/ui/breadcrumb"

import { SessionForm } from "@/components/session-form"
import { StepList } from "@/components/step-list"
import { getDb } from "@/lib/db"

type Props = { params: Promise<{ id: string; sessionId: string }> }

export default async function SessionDetailPage({ params }: Props) {
  const { id, sessionId } = await params
  const rawId = Number(id)
  const rawSessionId = Number(sessionId)
  if (
    !Number.isInteger(rawId) ||
    rawId <= 0 ||
    !Number.isInteger(rawSessionId) ||
    rawSessionId <= 0
  )
    notFound()
  const journeyId = parseJourneyId(rawId)
  const sessionIdNum = parseSessionId(rawSessionId)

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
            <BreadcrumbPage>{session.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="space-y-5">
        <h1 className="text-xl font-semibold text-foreground">세션 편집</h1>
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

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">스텝 목록</h2>
          <Link
            href={`/journeys/${journeyId}/sessions/${sessionIdNum}/steps/new`}
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
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
