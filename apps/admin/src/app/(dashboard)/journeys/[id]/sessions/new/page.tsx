import Link from "next/link"
import { notFound } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/ui/breadcrumb"

import { SessionForm } from "@/components/session-form"

type Props = { params: Promise<{ id: string }> }

export default async function NewSessionPage({ params }: Props) {
  const { id } = await params
  const journeyId = Number(id)
  if (Number.isNaN(journeyId)) notFound()

  return (
    <div className="space-y-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/journeys" />}>
              여정 관리
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={`/journeys/${journeyId}`} />}>
              여정
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>새 세션</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-xl font-semibold text-foreground">새 세션 추가</h1>

      <div className="max-w-lg">
        <SessionForm journeyId={journeyId} />
      </div>
    </div>
  )
}
