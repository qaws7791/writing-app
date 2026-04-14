import { eq } from "drizzle-orm"
import Link from "next/link"
import { notFound } from "next/navigation"

import { journeys, journeySessions, steps } from "@workspace/database"

import { JourneyForm } from "@/components/journey-form"
import { getDb } from "@/lib/db"

type Props = { params: Promise<{ id: string }> }

export default async function JourneyDetailPage({ params }: Props) {
  const { id } = await params
  const journeyId = Number(id)
  if (Number.isNaN(journeyId)) notFound()

  const db = getDb()
  const [journey] = await db
    .select()
    .from(journeys)
    .where(eq(journeys.id, journeyId))
    .limit(1)

  if (!journey) notFound()

  const sessions = await db
    .select()
    .from(journeySessions)
    .where(eq(journeySessions.journeyId, journeyId))
    .orderBy(journeySessions.order)

  return (
    <div className="space-y-8">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Link href="/journeys" className="hover:underline">
          여정 관리
        </Link>
        <span>/</span>
        <span>{journey.title}</span>
      </div>

      <section className="space-y-4">
        <h1 className="text-xl font-semibold">여정 편집</h1>
        <div className="max-w-lg">
          <JourneyForm
            journeyId={journey.id}
            defaultValues={{
              title: journey.title,
              description: journey.description,
              category: journey.category,
              thumbnailUrl: journey.thumbnailUrl ?? "",
            }}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">세션 목록</h2>
          <Link
            href={`/journeys/${journeyId}/sessions/new`}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
          >
            새 세션 추가
          </Link>
        </div>
        <div className="rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">순서</th>
                <th className="px-4 py-3 text-left font-medium">제목</th>
                <th className="px-4 py-3 text-left font-medium">예상 시간</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-muted-foreground px-4 py-8 text-center"
                  >
                    세션이 없습니다
                  </td>
                </tr>
              )}
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">{session.order}</td>
                  <td className="px-4 py-3 font-medium">{session.title}</td>
                  <td className="text-muted-foreground px-4 py-3">
                    {session.estimatedMinutes}분
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/journeys/${journeyId}/sessions/${session.id}`}
                      className="text-primary hover:underline"
                    >
                      편집
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
