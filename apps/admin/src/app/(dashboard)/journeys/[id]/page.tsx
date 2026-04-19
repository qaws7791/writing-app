import { eq } from "drizzle-orm"
import Link from "next/link"
import { notFound } from "next/navigation"

import { journeys, journeySessions } from "@workspace/database"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table"

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
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/journeys" />}>
              여정 관리
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{journey.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
          >
            새 세션 추가
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-3xl bg-muted py-12 text-center text-sm text-muted-foreground">
            세션이 없습니다
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>순서</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>예상 시간</TableHead>
                <TableHead> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.order}</TableCell>
                  <TableCell className="font-medium">{session.title}</TableCell>
                  <TableCell>{session.estimatedMinutes}분</TableCell>
                  <TableCell>
                    <Link
                      href={`/journeys/${journeyId}/sessions/${session.id}`}
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
      </section>
    </div>
  )
}
