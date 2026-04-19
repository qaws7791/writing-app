import Link from "next/link"
import { count, eq } from "drizzle-orm"

import { journeys, journeySessions } from "@workspace/database"
import { cn } from "@workspace/ui"
import { buttonVariants } from "@workspace/ui/components/ui/button"
import { Chip } from "@workspace/ui/components/ui/chip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table"

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
          <p className="mt-0.5 text-sm text-muted-foreground">
            총 {items.length}개의 여정
          </p>
        </div>
        <Link
          href="/journeys/new"
          className={cn(buttonVariants({ variant: "default", size: "sm" }))}
        >
          새 여정 추가
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl bg-muted py-16 text-center text-sm text-muted-foreground">
          여정이 없습니다
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>세션 수</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  <Chip size="sm">
                    {categoryLabels[item.category] ?? item.category}
                  </Chip>
                </TableCell>
                <TableCell>{item.sessionCount ?? 0}</TableCell>
                <TableCell>
                  {item.createdAt?.toLocaleDateString("ko-KR") ?? "-"}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/journeys/${item.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    편집
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
