import Link from "next/link"
import { notFound } from "next/navigation"

import { SessionForm } from "@/components/session-form"

type Props = { params: Promise<{ id: string }> }

export default async function NewSessionPage({ params }: Props) {
  const { id } = await params
  const journeyId = Number(id)
  if (Number.isNaN(journeyId)) notFound()

  return (
    <div className="space-y-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Link href="/journeys" className="hover:underline">
          여정 관리
        </Link>
        <span>/</span>
        <Link href={`/journeys/${journeyId}`} className="hover:underline">
          여정
        </Link>
        <span>/</span>
        <span>새 세션</span>
      </div>
      <h1 className="text-xl font-semibold">새 세션 추가</h1>
      <div className="max-w-lg">
        <SessionForm journeyId={journeyId} />
      </div>
    </div>
  )
}
