import { Breadcrumbs } from "@workspace/ui/components/breadcrumbs"

import { JourneyForm } from "@/components/journey-form"

export default function NewJourneyPage() {
  return (
    <div className="space-y-5">
      <Breadcrumbs>
        <Breadcrumbs.Item href="/journeys">여정 관리</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/journeys/new">새 여정</Breadcrumbs.Item>
      </Breadcrumbs>

      <h1 className="text-xl font-semibold text-foreground">새 여정 추가</h1>

      <div className="max-w-lg">
        <JourneyForm />
      </div>
    </div>
  )
}
