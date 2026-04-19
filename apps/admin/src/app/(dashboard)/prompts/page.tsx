import Link from "next/link"

import { writingPrompts } from "@workspace/database"
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">글감 관리</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            총 {items.length}개의 글감
          </p>
        </div>
        <Link
          href="/prompts/new"
          className={cn(buttonVariants({ variant: "default", size: "sm" }))}
        >
          새 글감 추가
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl bg-muted py-16 text-center text-sm text-muted-foreground">
          글감이 없습니다
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>타입</TableHead>
              <TableHead>응답 수</TableHead>
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
                    {typeLabels[item.promptType] ?? item.promptType}
                  </Chip>
                </TableCell>
                <TableCell>{item.responseCount}</TableCell>
                <TableCell>
                  {item.createdAt?.toLocaleDateString("ko-KR") ?? "-"}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/prompts/${item.id}`}
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
