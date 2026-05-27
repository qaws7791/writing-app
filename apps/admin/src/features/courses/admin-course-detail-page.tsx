import * as React from "react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/ui/empty"

import { AdminHeader } from "@/components/admin-header"

type AdminCourseDetailPageProps = {
  courseId: string
}

export function AdminCourseDetailPage({
  courseId,
}: AdminCourseDetailPageProps) {
  return (
    <>
      <AdminHeader
        description="챕터와 레슨 데이터는 이후 이 화면에서 확인합니다."
        title="코스 상세"
      />
      <main className="flex flex-col gap-6 p-6">
        <Empty aria-label="코스 상세 준비 중" className="rounded-lg border">
          <EmptyHeader>
            <EmptyTitle>상세 화면 준비 중</EmptyTitle>
            <EmptyDescription>
              선택한 코스 ID: <span className="font-medium">{courseId}</span>
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    </>
  )
}
