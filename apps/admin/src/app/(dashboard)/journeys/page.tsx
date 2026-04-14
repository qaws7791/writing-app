import Link from "next/link"
import { count, eq } from "drizzle-orm"

import { journeys, journeySessions } from "@workspace/database"
import { cn } from "@workspace/ui"
import { buttonVariants } from "@workspace/ui/components/button"
import { Table } from "@workspace/ui/components/table"

import { getDb } from "@/lib/db"

export default async function JourneysPage() {
  const db = getDb()

  const sessionCountSq = db
    .select({
      journeyId: journeySessions.journeyId,
      count: count().as("count"),
    })
    .from(journeySessions)
    .groupBy(journeySessions.journeyId)
    .as("session_counts")

  const items = await db
    .select({
      id: journeys.id,
      title: journeys.title,
      category: journeys.category,
      sessionCount: sessionCountSq.count,
      createdAt: journeys.createdAt,
    })
    .from(journeys)
    .leftJoin(sessionCountSq, eq(journeys.id, sessionCountSq.journeyId))
    .orderBy(journeys.createdAt)

  const categoryLabels: Record<string, string> = {
    writing_skill: "글쓰기 스킬",
    mindfulness: "마음챙김",
    practical: "실용",
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">여정 관리</h1>
          <p className="mt-0.5 text-sm text-muted">
            총 {items.length}개의 여정
          </p>
        </div>
        <Link
          href="/journeys/new"
          className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
        >
          새 여정 추가
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl bg-surface-secondary py-16 text-center text-sm text-muted">
          여정이 없습니다
        </div>
      ) : (
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="여정 목록">
              <Table.Header>
                <Table.Column isRowHeader>제목</Table.Column>
                <Table.Column>카테고리</Table.Column>
                <Table.Column>세션 수</Table.Column>
                <Table.Column>생성일</Table.Column>
                <Table.Column> </Table.Column>
              </Table.Header>
              <Table.Body>
                {items.map((item) => (
                  <Table.Row key={item.id} id={item.id}>
                    <Table.Cell className="font-medium">
                      {item.title}
                    </Table.Cell>
                    <Table.Cell>
                      {categoryLabels[item.category] ?? item.category}
                    </Table.Cell>
                    <Table.Cell>{item.sessionCount ?? 0}</Table.Cell>
                    <Table.Cell>
                      {item.createdAt?.toLocaleDateString("ko-KR") ?? "-"}
                    </Table.Cell>
                    <Table.Cell>
                      <Link
                        href={`/journeys/${item.id}`}
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
    </div>
  )
}
