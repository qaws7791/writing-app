import Link from "next/link"

import { writingPrompts } from "@workspace/database"

import { getDb } from "@/lib/db"

export default async function PromptsPage() {
  const db = getDb()
  const items = await db
    .select()
    .from(writingPrompts)
    .orderBy(writingPrompts.createdAt)

  const typeLabels: Record<string, string> = {
    sensory: "감각",
    reflection: "성찰",
    opinion: "의견",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">글감 관리</h1>
        <Link
          href="/prompts/new"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
        >
          새 글감 추가
        </Link>
      </div>
      <div className="rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">제목</th>
              <th className="px-4 py-3 text-left font-medium">타입</th>
              <th className="px-4 py-3 text-left font-medium">응답 수</th>
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
                  글감이 없습니다
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
                  {typeLabels[item.promptType] ?? item.promptType}
                </td>
                <td className="px-4 py-3">{item.responseCount}</td>
                <td className="text-muted-foreground px-4 py-3">
                  {item.createdAt?.toLocaleDateString("ko-KR") ?? "-"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/prompts/${item.id}`}
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
