import Link from "next/link"

import { writingPrompts } from "@workspace/database"
import { cn } from "@workspace/ui"
import { buttonVariants } from "@workspace/ui/components/button"
import { Table } from "@workspace/ui/components/table"

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
          <p className="mt-0.5 text-sm text-muted">
            총 {items.length}개의 글감
          </p>
        </div>
        <Link
          href="/prompts/new"
          className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
        >
          새 글감 추가
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl bg-surface-secondary py-16 text-center text-sm text-muted">
          글감이 없습니다
        </div>
      ) : (
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="글감 목록">
              <Table.Header>
                <Table.Column isRowHeader>제목</Table.Column>
                <Table.Column>타입</Table.Column>
                <Table.Column>응답 수</Table.Column>
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
                      {typeLabels[item.promptType] ?? item.promptType}
                    </Table.Cell>
                    <Table.Cell>{item.responseCount}</Table.Cell>
                    <Table.Cell>
                      {item.createdAt?.toLocaleDateString("ko-KR") ?? "-"}
                    </Table.Cell>
                    <Table.Cell>
                      <Link
                        href={`/prompts/${item.id}`}
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
