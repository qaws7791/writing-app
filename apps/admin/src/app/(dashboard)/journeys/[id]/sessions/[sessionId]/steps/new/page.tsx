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

import { StepForm } from "@/components/step-form"

type Props = { params: Promise<{ id: string; sessionId: string }> }

export default async function NewStepPage({ params }: Props) {
  const { id, sessionId } = await params
  const journeyId = Number(id)
  const sessionIdNum = Number(sessionId)
  if (Number.isNaN(journeyId) || Number.isNaN(sessionIdNum)) notFound()

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
            <BreadcrumbLink
              render={
                <Link
                  href={`/journeys/${journeyId}/sessions/${sessionIdNum}`}
                />
              }
            >
              세션
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>새 스텝</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-xl font-semibold text-foreground">새 스텝 추가</h1>

      <div className="max-w-2xl">
        <StepForm journeyId={journeyId} sessionId={sessionIdNum} />
      </div>
    </div>
  )
}
