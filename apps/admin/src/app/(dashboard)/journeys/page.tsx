import Link from "next/link"

import { getDb } from "@/lib/db"
import { journeys, journeySessions } from "@workspace/database"
import { count, eq } from "drizzle-orm"

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">여정 관리</h1>
        <Link
          href="/journeys/new"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
        >
          새 여정 추가
        </Link>
      </div>
      <div className="rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">제목</th>
              <th className="px-4 py-3 text-left font-medium">카테고리</th>
              <th className="px-4 py-3 text-left font-medium">세션 수</th>
              <th className="px-4 py-3 text-left font-medium">생성일</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-muted-foreground px-4 py-8 text-center"
                >
                  여정이 없습니다
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-border last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-medium">{item.title}</td>
                <td className="text-muted-foreground px-4 py-3">
                  {categoryLabels[item.category] ?? item.category}
                </td>
                <td className="px-4 py-3">{item.sessionCount ?? 0}</td>
                <td className="text-muted-foreground px-4 py-3">
                  {item.createdAt?.toLocaleDateString("ko-KR") ?? "-"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/journeys/${item.id}`}
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
    </div>
  )
}
