import { eq } from "drizzle-orm"
import Link from "next/link"
import { notFound } from "next/navigation"

import { journeys, journeySessions } from "@workspace/database"
import { cn } from "@workspace/ui"
import { buttonVariants } from "@workspace/ui/components/button"
import { Breadcrumbs } from "@workspace/ui/components/breadcrumbs"
import { Table } from "@workspace/ui/components/table"

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
      <Breadcrumbs>
        <Breadcrumbs.Item href="/journeys">여정 관리</Breadcrumbs.Item>
        <Breadcrumbs.Item href={`/journeys/${journeyId}`}>
          {journey.title}
        </Breadcrumbs.Item>
      </Breadcrumbs>

      <section className="space-y-5">
        <h1 className="text-xl font-semibold text-foreground">여정 편집</h1>
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

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">세션 목록</h2>
          <Link
            href={`/journeys/${journeyId}/sessions/new`}
            className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
          >
            새 세션 추가
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-3xl bg-surface-secondary py-12 text-center text-sm text-muted">
            세션이 없습니다
          </div>
        ) : (
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="세션 목록">
                <Table.Header>
                  <Table.Column>순서</Table.Column>
                  <Table.Column isRowHeader>제목</Table.Column>
                  <Table.Column>예상 시간</Table.Column>
                  <Table.Column> </Table.Column>
                </Table.Header>
                <Table.Body>
                  {sessions.map((session) => (
                    <Table.Row key={session.id} id={session.id}>
                      <Table.Cell>{session.order}</Table.Cell>
                      <Table.Cell className="font-medium">
                        {session.title}
                      </Table.Cell>
                      <Table.Cell>{session.estimatedMinutes}분</Table.Cell>
                      <Table.Cell>
                        <Link
                          href={`/journeys/${journeyId}/sessions/${session.id}`}
                          className="text-sm font-medium text-accent hover:underline"
                        >
                          편집
                        </Link>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </section>
    </div>
  )
}
