import Link from "next/link"

import { JourneyForm } from "@/components/journey-form"

export default function NewJourneyPage() {
  return (
    <div className="space-y-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Link href="/journeys" className="hover:underline">
          여정 관리
        </Link>
        <span>/</span>
        <span>새 여정</span>
      </div>
      <h1 className="text-xl font-semibold">새 여정 추가</h1>
      <div className="max-w-lg">
        <JourneyForm />
      </div>
    </div>
  )
}
