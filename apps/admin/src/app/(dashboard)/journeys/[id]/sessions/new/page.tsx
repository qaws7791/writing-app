import { notFound } from "next/navigation"

import { Breadcrumbs } from "@workspace/ui/components/breadcrumbs"

import { SessionForm } from "@/components/session-form"

type Props = { params: Promise<{ id: string }> }

export default async function NewSessionPage({ params }: Props) {
  const { id } = await params
  const journeyId = Number(id)
  if (Number.isNaN(journeyId)) notFound()

  return (
    <div className="space-y-5">
      <Breadcrumbs>
        <Breadcrumbs.Item href="/journeys">여정 관리</Breadcrumbs.Item>
        <Breadcrumbs.Item href={`/journeys/${journeyId}`}>
          여정
        </Breadcrumbs.Item>
        <Breadcrumbs.Item href={`/journeys/${journeyId}/sessions/new`}>
          새 세션
        </Breadcrumbs.Item>
      </Breadcrumbs>

      <h1 className="text-xl font-semibold text-foreground">새 세션 추가</h1>

      <div className="max-w-lg">
        <SessionForm journeyId={journeyId} />
      </div>
    </div>
  )
}
